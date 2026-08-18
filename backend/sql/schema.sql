-- =========================================================
-- COLITRACK — Schéma Supabase (phase Admin / Agence)
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- =========================================================

-- Extension pour uuid si besoin plus tard (optionnel, non utilisé pour l'id colis
-- puisqu'on utilise un identifiant "lisible" type CLT-YYMMDD-XXXX généré côté API)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Table des profils agents (complète auth.users de Supabase)
-- Un agent = un utilisateur Supabase Auth (email + mot de passe)
-- ---------------------------------------------------------
create table if not exists public.agents (
  id uuid primary key references auth.users (id) on delete cascade,
  nom_complet text not null,
  ville_agence text,
  -- chef    = administrateur / chef d'agence (accès complet, y compris Finance)
  -- guichet = guichetier (enregistrement des colis, encaissement)
  -- quai    = agent de quai (scan des colis, chargement/déchargement)
  role text not null default 'guichet' check (role in ('chef', 'guichet', 'quai')),
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.agents is 'Profil métier associé à chaque compte agent Supabase Auth';

-- ---------------------------------------------------------
-- Table des colis
-- ---------------------------------------------------------
create table if not exists public.colis (
  id text primary key,                 -- ex: CLT-260818-4F2A
  exp_nom text not null,
  exp_tel text not null,
  dest_nom text not null,
  dest_tel text not null,
  ville_depart text not null,
  ville_arrivee text not null,
  description text,
  poids numeric,
  statut text not null default 'enregistre'
    check (statut in ('enregistre', 'charge', 'depart', 'arrive')),
  cree_par uuid references public.agents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint villes_differentes check (ville_depart <> ville_arrivee)
);

create index if not exists idx_colis_statut on public.colis (statut);
create index if not exists idx_colis_created_at on public.colis (created_at desc);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_colis_updated_at on public.colis;
create trigger trg_colis_updated_at
  before update on public.colis
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Historique des scans (journal d'audit, une ligne par étape franchie)
-- ---------------------------------------------------------
create table if not exists public.colis_historique (
  id bigint generated always as identity primary key,
  colis_id text not null references public.colis (id) on delete cascade,
  etape text not null check (etape in ('enregistre', 'charge', 'depart', 'arrive')),
  agent_id uuid references public.agents (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_historique_colis on public.colis_historique (colis_id);

-- ---------------------------------------------------------
-- Encaissements (fondation du module Finance — phase 2)
-- Une ligne par paiement encaissé au guichet pour un colis.
-- ---------------------------------------------------------
create table if not exists public.encaissements (
  id bigint generated always as identity primary key,
  colis_id text references public.colis (id) on delete set null,
  agent_id uuid references public.agents (id),
  montant numeric not null check (montant >= 0),
  moyen_paiement text not null check (moyen_paiement in ('especes', 'orange_money', 'mtn_momo', 'virement')),
  created_at timestamptz not null default now()
);

create index if not exists idx_encaissements_agent on public.encaissements (agent_id);
create index if not exists idx_encaissements_created_at on public.encaissements (created_at desc);

alter table public.encaissements enable row level security;
-- Comme pour colis/colis_historique : pas de policy publique, le backend
-- (clé service_role) contrôle l'accès — routes réservées au rôle "chef".

-- ---------------------------------------------------------
-- Row Level Security
-- Phase actuelle : seuls les agents authentifiés (via le backend,
-- qui utilise la clé service_role) peuvent lire/écrire.
-- La lecture publique pour le suivi client sera ouverte en phase 2
-- (ex: policy "select" pour role anon limitée à quelques colonnes).
-- ---------------------------------------------------------
alter table public.agents enable row level security;
alter table public.colis enable row level security;
alter table public.colis_historique enable row level security;

-- Un agent peut lire son propre profil
drop policy if exists "agents_select_self" on public.agents;
create policy "agents_select_self" on public.agents
  for select using (auth.uid() = id);

-- Aucune policy publique sur colis / colis_historique pour l'instant :
-- le backend utilise la clé service_role (bypass RLS) après avoir vérifié
-- lui-même le token de l'agent. Cela garde le contrôle métier côté API.
