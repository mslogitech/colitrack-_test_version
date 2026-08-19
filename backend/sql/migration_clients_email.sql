-- =========================================================
-- COLITRACK — Migration : comptes clients + notifications email
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- (à lancer après schema.sql, une seule fois)
-- =========================================================

-- ---------------------------------------------------------
-- Table des clients (complète auth.users de Supabase)
-- Un client = une personne qui s'inscrit sur le site pour ENVOYER un colis.
-- La consultation/suivi d'un colis, elle, reste publique et ne nécessite
-- aucun compte (voir route publique GET /api/public/colis/:id).
-- ---------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key references auth.users (id) on delete cascade,
  nom_complet text not null,
  telephone text,
  email text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.clients is 'Profil client (expéditeur) — inscription en libre-service pour envoyer des colis';

alter table public.clients enable row level security;

drop policy if exists "clients_select_self" on public.clients;
create policy "clients_select_self" on public.clients
  for select using (auth.uid() = id);

-- ---------------------------------------------------------
-- Colis : ajout des emails (pour les notifications) et du lien
-- vers le compte client si le colis a été envoyé en libre-service
-- (reste NULL si le colis a été enregistré au guichet par un agent).
-- ---------------------------------------------------------
alter table public.colis add column if not exists exp_email text;
alter table public.colis add column if not exists dest_email text;
alter table public.colis add column if not exists client_id uuid references public.clients (id);

create index if not exists idx_colis_client on public.colis (client_id);
