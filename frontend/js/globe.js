/**
 * KING ICE GOLD — 3D Product Globe
 * Three.js CSS3DRenderer — Logo in 3D scene for proper occlusion
 */
(function () {
    'use strict';

    var PRODUCTS = [
        { src: 'images/products/cadenas/cadena-1.webp', size: 125 },
        { src: 'images/products/cadenas/cadena-2.webp', size: 90 },
        { src: 'images/products/cadenas/cadena-3.webp', size: 80 },
        { src: 'images/products/cadenas/cadena-4.webp', size: 100 },
        { src: 'images/products/cadenas/cadena-5.jpg', size: 70 },
        { src: 'images/products/cadenas/cadena-7.webp', size: 85 },
        { src: 'images/products/anillos/anillo-1.webp', size: 110 },
        { src: 'images/products/anillos/anillo-2.jpg', size: 95 },
        { src: 'images/products/anillos/anillo-4.webp', size: 75 },
        { src: 'images/products/relojes/reloj-1.webp', size: 120 },
        { src: 'images/products/relojes/reloj-2.webp', size: 88 },
        { src: 'images/products/relojes/reloj-3.webp', size: 95 },
        { src: 'images/products/aretes/aretes-1.webp', size: 100 },
        { src: 'images/products/aretes/aretes-3.webp', size: 72 },
        { src: 'images/products/aretes/aretes-5.jpg', size: 80 },
        { src: 'images/products/diamantes/diamante-1.jpg', size: 115 },
        { src: 'images/products/diamantes/diamante-3.jpg', size: 78 },
        { src: 'images/products/pulsos/pulso-1.jpg', size: 105 },
        { src: 'images/products/pulsos/pulso-3.jpg', size: 82 },
        { src: 'images/products/dijes/dije-1.webp', size: 98 },
        { src: 'images/products/dijes/dije-2.webp', size: 68 },
        { src: 'images/products/religiosos/religioso-1.webp', size: 92 },
        { src: 'images/products/religiosos/religioso-2.webp', size: 74 },
        { src: 'images/products/religiosos/religioso-4.webp', size: 65 },
    ];

    var container = document.getElementById('globeContainer');
    if (!container) return;

    // Hide the CSS logo overlay — we'll put the logo inside the 3D scene
    var cssLogo = container.querySelector('.globe-center-logo');
    if (cssLogo) cssLogo.style.display = 'none';

    // --- Scene, Camera, Renderer ---
    var scene = new THREE.Scene();
    var width = container.clientWidth;
    var height = container.clientHeight;

    var camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.z = 850;

    var renderer = new THREE.CSS3DRenderer();
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);

    // --- Sphere group (rotates) ---
    var sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    sphereGroup.rotation.x = -0.1;
    sphereGroup.rotation.z = 0.03;

    // --- Logo as a 3D object at center (z=0), part of the scene but NOT rotating ---
    var logoEl = document.createElement('div');
    logoEl.className = 'globe-3d-logo';
    var logoImg = document.createElement('img');
    logoImg.src = 'images/logo-crown.svg';
    logoImg.alt = 'King Ice Gold';
    logoEl.appendChild(logoImg);

    var logoObject = new THREE.CSS3DObject(logoEl);
    logoObject.position.set(0, 0, 0); // dead center
    scene.add(logoObject); // added to scene, NOT sphereGroup, so it doesn't rotate

    // --- Fibonacci sphere distribution ---
    var SPHERE_RADIUS = 310;
    var numItems = PRODUCTS.length;
    var goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (var i = 0; i < numItems; i++) {
        var product = PRODUCTS[i];

        var y = 1 - (i / (numItems - 1)) * 2;
        var radiusAtY = Math.sqrt(1 - y * y);
        var theta = goldenAngle * i;

        var x = Math.cos(theta) * radiusAtY;
        var z = Math.sin(theta) * radiusAtY;

        var card = document.createElement('div');
        card.className = 'globe-3d-card';
        card.style.width = product.size + 'px';
        card.style.height = product.size + 'px';

        var img = document.createElement('img');
        img.src = product.src;
        img.alt = 'Joyería';
        img.loading = 'lazy';
        img.className = 'globe-3d-img';

        card.appendChild(img);

        var cssObject = new THREE.CSS3DObject(card);
        cssObject.position.set(
            x * SPHERE_RADIUS,
            y * SPHERE_RADIUS,
            z * SPHERE_RADIUS
        );

        // Face outward
        var lookTarget = new THREE.Vector3(
            x * SPHERE_RADIUS * 2,
            y * SPHERE_RADIUS * 2,
            z * SPHERE_RADIUS * 2
        );
        cssObject.lookAt(lookTarget);

        sphereGroup.add(cssObject);
    }

    // --- Animation ---
    var speed = 0.0025;

    function animate() {
        requestAnimationFrame(animate);
        sphereGroup.rotation.y += speed;
        renderer.render(scene, camera);
    }

    animate();

    // --- Resize ---
    window.addEventListener('resize', function () {
        var w = container.clientWidth;
        var h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
})();
