(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- MOBILE NAV ---------- */

    var navToggle = document.getElementById("navToggle");
    var navMenu = document.getElementById("navMenu");

    function closeNav() {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
    }

    navToggle.addEventListener("click", function () {
        var isOpen = navMenu.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("nav-open", isOpen);
    });

    navMenu.addEventListener("click", function (event) {
        if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeNav();
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 760) closeNav();
    });

    /* ---------- STICKY NAV STATE ---------- */

    var navbar = document.getElementById("navbar");

    function onScroll() {
        navbar.classList.toggle("scrolled", window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- ACTIVE NAV LINK ---------- */

    var navLinks = Array.prototype.slice.call(
        navMenu.querySelectorAll('a[href^="#"]:not(.nav-cta)')
    );

    var sections = navLinks
        .map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        })
        .filter(Boolean);

    function setActiveLink() {
        var current = sections[0];

        sections.forEach(function (section) {
            if (section.getBoundingClientRect().top <= 140) current = section;
        });

        navLinks.forEach(function (link) {
            link.classList.toggle(
                "active",
                current && link.getAttribute("href") === "#" + current.id
            );
        });
    }

    setActiveLink();
    window.addEventListener("scroll", setActiveLink, { passive: true });

    /* ---------- SCROLL REVEAL ---------- */

    var revealTargets = document.querySelectorAll(
        ".section-heading, .service-card, .step, .feature, .about-box, .about-list, .faq-item, .cta h2, .cta p, .cta .btn, .contact-form, .contact-details"
    );

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealTargets.forEach(function (el) {
            el.classList.add("visible");
        });
    } else {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
        );

        revealTargets.forEach(function (el, index) {
            el.classList.add("reveal");
            el.style.transitionDelay = (index % 3) * 80 + "ms";
            revealObserver.observe(el);
        });
    }

    /* ---------- FAQ: ONE OPEN AT A TIME ---------- */

    var faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(function (item) {
        item.addEventListener("toggle", function () {
            if (!item.open) return;
            faqItems.forEach(function (other) {
                if (other !== item) other.open = false;
            });
        });
    });

    /* ---------- CONTACT FORM ---------- */

    var contactForm = document.getElementById("contactForm");
    var submitBtn = document.getElementById("submitBtn");
    var formStatus = document.getElementById("formStatus");
    var accessKey = document.getElementById("accessKey");

    var validators = {
        name: function (value) {
            if (!value.trim()) return "Please enter your name.";
            return "";
        },
        email: function (value) {
            if (!value.trim()) return "Please enter your email.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
                return "Please enter a valid email address.";
            return "";
        },
        message: function (value) {
            if (!value.trim()) return "Please tell us about your project.";
            if (value.trim().length < 20)
                return "A little more detail helps us reply properly.";
            return "";
        }
    };

    function showError(field, message) {
        var errorEl = document.querySelector('[data-error-for="' + field.id + '"]');
        field.classList.toggle("invalid", Boolean(message));
        if (errorEl) errorEl.textContent = message;
    }

    function setStatus(message, kind) {
        formStatus.textContent = message;
        formStatus.className = "form-status" + (kind ? " " + kind : "");
    }

    contactForm.addEventListener(
        "input",
        function (event) {
            var field = event.target;
            if (validators[field.id]) showError(field, validators[field.id](field.value));
        },
        true
    );

    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var firstInvalidField = null;

        Object.keys(validators).forEach(function (id) {
            var field = document.getElementById(id);
            var message = validators[id](field.value);
            showError(field, message);
            if (message && !firstInvalidField) firstInvalidField = field;
        });

        if (firstInvalidField) {
            firstInvalidField.focus();
            setStatus("Please fix the highlighted fields.", "error");
            return;
        }

        var key = accessKey.value.trim();

        if (!key || key === "PASTE_YOUR_WEB3FORMS_ACCESS_KEY") {
            setStatus(
                "Add your Web3Forms access key to the access_key field in index.html before going live.",
                "error"
            );
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
        setStatus("");

        var sentName = document.getElementById("name").value.trim();
        var sentEmail = document.getElementById("email").value.trim();
        var sentBusiness = document.getElementById("business").value.trim();
        var sentBudget = document.getElementById("budget").value;
        var sentMessage = document.getElementById("message").value.trim();

        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                access_key: key,
                name: sentName,
                email: sentEmail,
                business: sentBusiness,
                budget: sentBudget,
                message: sentMessage,
                from_name: "TK Verse Digital Website"
            })
        })
            .then(function (res) {
                return res.json().then(function (data) {
                    if (!res.ok || !data.success) {
                        throw new Error(data.message || "Submission failed.");
                    }
                    return data;
                });
            })
            .then(function () {
                var firstName = sentName.split(" ")[0];
                contactForm.reset();
                setStatus(
                    "Thanks, " + firstName + ". Your message is on its way and we reply within one business day.",
                    "success"
                );
            })
            .catch(function (error) {
                setStatus(
                    error.message + " Please try again, or email us directly.",
                    "error"
                );
            })
            .then(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = "Send Message";
            });
    });
})();
