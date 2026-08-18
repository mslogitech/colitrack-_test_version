document.querySelectorAll(".s-nav-link").forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelectorAll(".s-nav-link").forEach(function (l) { l.classList.remove("active"); });
    this.classList.add("active");
    var panel = this.getAttribute("data-panel");
    document.querySelectorAll(".s-panel").forEach(function (p) {
      p.style.display = p.id === panel ? "" : "none";
    });
  });
});
