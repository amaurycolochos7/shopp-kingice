/**
 * Admin Sidebar Toggle — shared across all admin pages
 * Handles mobile off-canvas sidebar open/close with backdrop
 */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        const sidebar = document.querySelector('.admin-sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const backdrop = document.getElementById('sidebarBackdrop');

        if (!sidebar || !toggle || !backdrop) return;

        function openSidebar() {
            sidebar.classList.add('open');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }

        toggle.addEventListener('click', openSidebar);
        backdrop.addEventListener('click', closeSidebar);

        // Close on nav link click (mobile)
        sidebar.querySelectorAll('.admin-nav-link').forEach(function (link) {
            link.addEventListener('click', closeSidebar);
        });

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });
    });
})();
