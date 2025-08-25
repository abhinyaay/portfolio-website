// Matter.js Physics Engine Setup
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Constraint = Matter.Constraint;

class PhysicsPortfolio {
    constructor() {
        this.engine = Engine.create();
        this.canvas = document.getElementById('physics-canvas');
        this.world = this.engine.world;
        this.gravityBalls = [];
        this.particles = [];
        this.mouseConstraint = null;
        
        this.init();
        this.setupEventListeners();
        this.createGeometricShapes();
        this.createParticleNetwork();
        this.animate();
    }

    init() {
        // Disable default gravity for custom effects
        this.engine.world.gravity.y = 0.5;
        this.engine.world.gravity.x = 0;

        // Setup renderer
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent',
                showVelocity: false,
                showAngleIndicator: false,
                showDebug: false
            }
        });

        // Setup mouse control
        const mouse = Mouse.create(this.canvas);
        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        World.add(this.world, this.mouseConstraint);

        // Create boundaries
        this.createBoundaries();

        // Start rendering
        Render.run(this.render);
        Engine.run(this.engine);
    }

    createBoundaries() {
        const walls = [
            // Bottom
            Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 30, window.innerWidth, 60, { 
                isStatic: true,
                render: { visible: false }
            }),
            // Top
            Bodies.rectangle(window.innerWidth / 2, -30, window.innerWidth, 60, { 
                isStatic: true,
                render: { visible: false }
            }),
            // Left
            Bodies.rectangle(-30, window.innerHeight / 2, 60, window.innerHeight, { 
                isStatic: true,
                render: { visible: false }
            }),
            // Right
            Bodies.rectangle(window.innerWidth + 30, window.innerHeight / 2, 60, window.innerHeight, { 
                isStatic: true,
                render: { visible: false }
            })
        ];

        World.add(this.world, walls);
    }

    createGeometricShapes() {
        // Create animated geometric shapes
        this.shapeContainer = document.createElement('div');
        this.shapeContainer.id = 'geometric-shapes';
        this.shapeContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;
        document.body.appendChild(this.shapeContainer);

        const shapes = ['triangle', 'square', 'hexagon', 'diamond'];
        const colors = ['#00f5ff', '#7c3aed', '#ff0080', '#ff6b35'];
        
        for (let i = 0; i < 15; i++) {
            const shape = document.createElement('div');
            const shapeType = shapes[i % shapes.length];
            const size = Math.random() * 40 + 20;
            
            shape.className = `geometric-shape ${shapeType}`;
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: 0.7;
                transform-origin: center;
                animation: rotate-${i % 4} ${8 + Math.random() * 6}s linear infinite,
                          drift-${i % 3} ${10 + Math.random() * 5}s ease-in-out infinite;
                transition: all 0.3s ease;
            `;
            
            // Set shape-specific styles
            if (shapeType === 'triangle') {
                shape.style.width = '0';
                shape.style.height = '0';
                shape.style.borderLeft = `${size/2}px solid transparent`;
                shape.style.borderRight = `${size/2}px solid transparent`;
                shape.style.borderBottom = `${size}px solid ${colors[i % colors.length]}`;
                shape.style.filter = `drop-shadow(0 0 10px ${colors[i % colors.length]})`;
            } else if (shapeType === 'square') {
                shape.style.background = colors[i % colors.length];
                shape.style.boxShadow = `0 0 20px ${colors[i % colors.length]}`;
            } else if (shapeType === 'hexagon') {
                shape.style.background = colors[i % colors.length];
                shape.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                shape.style.filter = `drop-shadow(0 0 15px ${colors[i % colors.length]})`;
            } else if (shapeType === 'diamond') {
                shape.style.background = colors[i % colors.length];
                shape.style.transform += ' rotate(45deg)';
                shape.style.boxShadow = `0 0 25px ${colors[i % colors.length]}`;
            }
            
            this.shapeContainer.appendChild(shape);
            this.gravityBalls.push(shape);
        }
    }

    createParticleNetwork() {
        // Create particle network effect
        this.networkContainer = document.createElement('canvas');
        this.networkContainer.id = 'particle-network';
        this.networkContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        `;
        this.networkContainer.width = window.innerWidth;
        this.networkContainer.height = window.innerHeight;
        document.body.appendChild(this.networkContainer);
        
        this.networkCtx = this.networkContainer.getContext('2d');
        this.networkParticles = [];
        
        // Create network particles
        for (let i = 0; i < 50; i++) {
            this.networkParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
                connections: []
            });
        }
        
        this.animateNetwork();
    }

    addMouseInteraction() {
        this.mousePos = { x: 0, y: 0 };
        
        // Throttle mouse events for better performance
        let mouseTimeout;
        document.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;

            // Clear previous timeout
            if (mouseTimeout) clearTimeout(mouseTimeout);
            
            // Throttle shape animations
            mouseTimeout = setTimeout(() => {
                this.gravityBalls.forEach((shape, index) => {
                    if (shape.style && !shape.isAnimating) {
                        const rect = shape.getBoundingClientRect();
                        const shapeX = rect.left + rect.width / 2;
                        const shapeY = rect.top + rect.height / 2;
                        
                        const distance = Math.sqrt(
                            Math.pow(this.mousePos.x - shapeX, 2) + 
                            Math.pow(this.mousePos.y - shapeY, 2)
                        );

                        if (distance < 120) {
                            const intensity = (120 - distance) / 120;
                            const scale = 1 + intensity * 0.2;
                            
                            // Use requestAnimationFrame for smooth animation
                            requestAnimationFrame(() => {
                                shape.style.transform = `scale(${scale})`;
                                shape.style.opacity = Math.max(0.7, 0.7 + intensity * 0.2);
                                shape.classList.add('shape-hover');
                            });
                        } else {
                            requestAnimationFrame(() => {
                                shape.style.transform = 'scale(1)';
                                shape.style.opacity = '0.7';
                                shape.classList.remove('shape-hover');
                            });
                        }
                    }
                });
            }, 16); // ~60fps throttling
        });

        // Click to create explosion effect
        document.addEventListener('click', (e) => {
            this.createExplosionEffect(e.clientX, e.clientY);
        });
    }

    createExplosionEffect(x, y) {
        const colors = ['#00f5ff', '#7c3aed', '#ff0080', '#ff6b35'];
        
        // Create multiple explosion particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = (i / 12) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px ${color};
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle
            particle.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${Math.cos(angle) * distance - 50}%, ${Math.sin(angle) * distance - 50}%) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 800 + Math.random() * 400,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
        
        // Create central flash
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #ffffff 0%, #00f5ff 50%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1001;
            transform: translate(-50%, -50%);
        `;
        
        document.body.appendChild(flash);
        
        flash.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease-out'
        }).onfinish = () => {
            flash.remove();
        };
    }

    animateNetwork() {
        const ctx = this.networkCtx;
        let frameCount = 0;
        
        const animate = () => {
            frameCount++;
            
            // Only update every other frame for better performance
            if (frameCount % 2 === 0) {
                ctx.clearRect(0, 0, this.networkContainer.width, this.networkContainer.height);
                
                // Update particles
                this.networkParticles.forEach(particle => {
                    // Move particle
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // Bounce off edges
                    if (particle.x < 0 || particle.x > this.networkContainer.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > this.networkContainer.height) particle.vy *= -1;
                    
                    // Simplified mouse interaction
                    if (this.mousePos && frameCount % 4 === 0) {
                        const dx = this.mousePos.x - particle.x;
                        const dy = this.mousePos.y - particle.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 80) {
                            const force = (80 - distance) / 2000;
                            particle.vx += dx * force;
                            particle.vy += dy * force;
                        }
                    }
                    
                    // Draw particle (simplified)
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = particle.color;
                    ctx.fill();
                });
                
                // Draw connections (reduced frequency)
                if (frameCount % 3 === 0) {
                    this.networkParticles.forEach((particle, i) => {
                        this.networkParticles.slice(i + 1).forEach(other => {
                            const dx = particle.x - other.x;
                            const dy = particle.y - other.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < 120) {
                                ctx.beginPath();
                                ctx.moveTo(particle.x, particle.y);
                                ctx.lineTo(other.x, other.y);
                                ctx.strokeStyle = `rgba(0, 245, 255, ${(120 - distance) / 120 * 0.2})`;
                                ctx.lineWidth = 0.5;
                                ctx.stroke();
                            }
                        });
                    });
                }
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    animate() {
        // Add gentle movement to orbs
        setInterval(() => {
            this.gravityBalls.forEach((orb, index) => {
                if (orb.style && !orb.style.transform.includes('translate')) {
                    const randomX = (Math.random() - 0.5) * 10;
                    const randomY = (Math.random() - 0.5) * 10;
                    orb.style.transform = `translate(${randomX}px, ${randomY}px)`;
                    
                    setTimeout(() => {
                        orb.style.transform = 'translate(0, 0)';
                    }, 2000);
                }
            });
        }, 5000);

        // Add sparkle effect to random stars
        setInterval(() => {
            const randomStar = this.particles[Math.floor(Math.random() * this.particles.length)];
            if (randomStar && randomStar.style) {
                randomStar.style.boxShadow = '0 0 15px #00f5ff, 0 0 25px #00f5ff';
                setTimeout(() => {
                    randomStar.style.boxShadow = '0 0 6px #00f5ff';
                }, 500);
            }
        }, 1000);
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render.canvas.width = window.innerWidth;
        this.render.canvas.height = window.innerHeight;
        this.render.options.width = window.innerWidth;
        this.render.options.height = window.innerHeight;
        
        // Remove old boundaries and create new ones
        World.clear(this.world);
        this.createBoundaries();
        World.add(this.world, [...this.gravityBalls, ...this.particles, this.mouseConstraint]);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        this.addMouseInteraction();
        
        // Ensure canvas is ready for interactions
        this.canvas.style.pointerEvents = 'auto';
    }
}

// Navigation functionality
class Navigation {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.init();
    }

    init() {
        this.hamburger.addEventListener('click', () => {
            this.hamburger.classList.toggle('active');
            this.navMenu.classList.toggle('active');
        });

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.hamburger.classList.remove('active');
                this.navMenu.classList.remove('active');
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            } else {
                navbar.style.background = 'rgba(10, 10, 10, 0.9)';
            }
        });
    }
}

// Scroll animations
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, this.observerOptions);

        // Observe elements for scroll animations
        const animatedElements = document.querySelectorAll('.highlight-item, .skill-category, .project-card, .contact-method');
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }
}

// Floating elements animation
class FloatingElements {
    constructor() {
        this.elements = document.querySelectorAll('.floating-element');
        this.init();
    }

    init() {
        this.elements.forEach((element, index) => {
            element.addEventListener('mouseover', () => {
                element.style.animation = 'none';
                element.style.transform = 'scale(1.2) rotate(10deg)';
            });

            element.addEventListener('mouseout', () => {
                element.style.animation = `float 6s ease-in-out infinite`;
                element.style.animationDelay = `${index}s`;
                element.style.transform = 'scale(1) rotate(0deg)';
            });

            element.addEventListener('click', () => {
                // Create burst effect
                this.createBurstEffect(element);
            });
        });
    }

    createBurstEffect(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = '#00f5ff';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            document.body.appendChild(particle);

            const angle = (i / 8) * Math.PI * 2;
            const distance = 100;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { 
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: 800,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }
}



// Particle cursor trail
class CursorTrail {
    constructor() {
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (Math.random() < 0.3) {
                this.addParticle();
            }
        });

        this.animate();
    }

    addParticle() {
        const particle = {
            x: this.mouse.x + (Math.random() - 0.5) * 20,
            y: this.mouse.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            decay: Math.random() * 0.02 + 0.01,
            size: Math.random() * 3 + 1
        };

        this.particles.push(particle);
    }

    animate() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;

                if (particle.life <= 0) {
                    this.particles.splice(index, 1);
                    return;
                }

                ctx.save();
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = '#00f5ff';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            requestAnimationFrame(loop);
        };

        loop();

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
}

// Project Carousel functionality
class ProjectCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.project-slide');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.currentSlide = 0;
        
        this.init();
    }

    init() {
        // Add click listeners to navigation buttons
        this.navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });

        // Auto-rotate slides every 10 seconds
        setInterval(() => {
            this.nextSlide();
        }, 10000);
    }

    goToSlide(index) {
        // Remove active class from current slide and nav button
        this.slides[this.currentSlide].classList.remove('active');
        this.navButtons[this.currentSlide].classList.remove('active');

        // Set new current slide
        this.currentSlide = index;

        // Add active class to new slide and nav button
        this.slides[this.currentSlide].classList.add('active');
        this.navButtons[this.currentSlide].classList.add('active');
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }
}

// Enhanced responsive design for project showcase
class ResponsiveProjects {
    constructor() {
        this.init();
        this.handleResize();
    }

    init() {
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const projectMains = document.querySelectorAll('.project-main');
        
        if (window.innerWidth <= 768) {
            projectMains.forEach(main => {
                main.style.gridTemplateColumns = '1fr';
                main.style.textAlign = 'center';
            });
        } else {
            projectMains.forEach(main => {
                main.style.gridTemplateColumns = '1fr 1fr';
                main.style.textAlign = 'left';
            });
        }
    }
}

// Project View Toggle functionality
class ProjectViewToggle {
    constructor() {
        this.carousel = document.querySelector('.project-carousel');
        this.grid = document.getElementById('project-grid');
        this.navigation = document.getElementById('carousel-navigation');
        this.toggleButtons = document.querySelectorAll('.toggle-btn');
        this.currentView = 'carousel';
        
        this.init();
    }

    init() {
        this.toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view !== this.currentView) {
                    this.switchView(view);
                }
            });
        });
    }

    switchView(view) {
        // Update button states
        this.toggleButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Fade out current view
        const currentElement = this.currentView === 'carousel' ? this.carousel : this.grid;
        const currentNavigation = this.navigation;
        
        currentElement.style.opacity = '0';
        currentElement.style.transform = 'translateY(20px)';
        
        if (this.currentView === 'carousel') {
            currentNavigation.style.opacity = '0';
            currentNavigation.style.transform = 'translateY(20px)';
        }

        // Switch views after fade out
        setTimeout(() => {
            if (view === 'carousel') {
                this.carousel.style.display = 'block';
                this.grid.style.display = 'none';
                this.navigation.style.display = 'flex';
                
                // Fade in carousel
                setTimeout(() => {
                    this.carousel.style.opacity = '1';
                    this.carousel.style.transform = 'translateY(0)';
                    this.navigation.style.opacity = '1';
                    this.navigation.style.transform = 'translateY(0)';
                }, 50);
            } else {
                this.carousel.style.display = 'none';
                this.grid.style.display = 'grid';
                this.navigation.style.display = 'none';
                
                // Fade in grid
                setTimeout(() => {
                    this.grid.style.opacity = '1';
                    this.grid.style.transform = 'translateY(0)';
                }, 50);
            }
            
            this.currentView = view;
        }, 300);
    }
}

// Grid Project Card Interactions
class GridProjectCards {
    constructor() {
        this.cards = document.querySelectorAll('.project-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                this.createParticleEffect(card);
            });

            // Add click to view details functionality
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (!e.target.closest('.card-actions')) {
                    const projectId = card.dataset.project;
                    this.showProjectDetails(projectId);
                }
            });
        });
    }

    createParticleEffect(card) {
        const rect = card.getBoundingClientRect();
        const colors = ['#00f5ff', '#7c3aed', '#ff0080', '#ff6b35'];
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top + Math.random() * rect.height}px;
                width: 4px;
                height: 4px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 0 8px ${color};
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle
            particle.animate([
                { 
                    transform: 'scale(1) translateY(0)',
                    opacity: 1
                },
                { 
                    transform: 'scale(0) translateY(-50px)',
                    opacity: 0
                }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }

    showProjectDetails(projectId) {
        // Switch to carousel view and show specific project
        const viewToggle = document.querySelector('[data-view="carousel"]');
        if (viewToggle && !viewToggle.classList.contains('active')) {
            viewToggle.click();
            
            // Wait for view switch then navigate to project
            setTimeout(() => {
                const navBtn = document.querySelector(`[data-target="${projectId}"]`);
                if (navBtn) {
                    navBtn.click();
                }
            }, 400);
        } else {
            // Already in carousel view, just navigate
            const navBtn = document.querySelector(`[data-target="${projectId}"]`);
            if (navBtn) {
                navBtn.click();
            }
        }
    }
}

// Contact Form Handler
class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.statusDiv = document.getElementById('form-status');
        this.submitBtn = null;
        this.debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.init();
    }

    init() {
        if (this.form) {
            this.submitBtn = this.form.querySelector('.form-submit-btn');
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Add real-time validation
            this.setupValidation();
        }
    }

    setupValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styles
        field.classList.remove('error');

        switch (fieldName) {
            case 'name':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters long';
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
            case 'subject':
                if (value.length < 5) {
                    isValid = false;
                    errorMessage = 'Subject must be at least 5 characters long';
                }
                break;
            case 'message':
                if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Message must be at least 10 characters long';
                }
                break;
        }

        if (!isValid) {
            field.classList.add('error');
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showFieldError(field, message) {
        // Remove existing error message
        this.clearFieldError(field);
        
        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate form before submission
        if (!this.validateForm()) {
            this.showStatus('error', 'Please fix the errors above before submitting.');
            return;
        }

        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Disable submit button and show loading state
        this.setSubmitButtonState('loading');
        this.showStatus('loading', 'Sending message...');

        try {
            // Using Formspree for form handling with proper configuration
            const response = await fetch('https://formspree.io/f/xdkoqpko', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    _replyto: data.email,
                    _subject: `Portfolio Contact: ${data.subject}`
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showStatus('success', 'Message sent successfully! I\'ll get back to you soon.');
                this.form.reset();
                this.clearAllFieldErrors();
                
                // Track successful submission (optional analytics)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        event_category: 'Contact',
                        event_label: 'Success'
                    });
                }
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Debug mode: Show detailed error information
            if (this.debugMode) {
                console.log('Form data:', data);
                console.log('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            
            // Provide more specific error messages and fallback options
            let errorMessage = 'Failed to send message. ';
            
            if (error.name === 'NetworkError' || !navigator.onLine) {
                errorMessage += 'Please check your internet connection and try again.';
            } else if (error.message.includes('rate limit')) {
                errorMessage += 'Too many submissions. Please wait a moment and try again.';
            } else if (error.message.includes('CORS')) {
                errorMessage += 'There was a configuration issue. Please try the alternative contact methods below.';
            } else {
                errorMessage += 'Please try emailing me directly at abhinyaay@gmail.com';
            }
            
            this.showStatus('error', errorMessage);
            this.showFallbackOptions(data);
            
            // Track failed submission (optional analytics)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    event_category: 'Contact',
                    event_label: 'Error'
                });
            }
        } finally {
            this.setSubmitButtonState('normal');
        }
    }

    setSubmitButtonState(state) {
        if (!this.submitBtn) return;

        switch (state) {
            case 'loading':
                this.submitBtn.disabled = true;
                this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                break;
            case 'normal':
                this.submitBtn.disabled = false;
                this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                break;
        }
    }

    clearAllFieldErrors() {
        const errorElements = this.form.querySelectorAll('.field-error');
        errorElements.forEach(element => element.remove());
        
        const errorFields = this.form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    showFallbackOptions(data) {
        // Create fallback buttons for alternative contact methods
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'fallback-options';
        fallbackContainer.innerHTML = `
            <div class="fallback-title">Alternative Contact Methods:</div>
            <div class="fallback-buttons">
                <button class="fallback-btn email-btn" onclick="window.open('mailto:abhinyaay@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Hi Abhinay,\n\n${data.message}\n\nBest regards,\n${data.name}\n${data.email}`)}')" title="Open email client">
                    <i class="fas fa-envelope"></i>
                    Email Direct
                </button>
                <button class="fallback-btn linkedin-btn" onclick="window.open('https://linkedin.com/in/abhinyaay', '_blank')" title="Contact via LinkedIn">
                    <i class="fab fa-linkedin"></i>
                    LinkedIn
                </button>
                <button class="fallback-btn copy-btn" onclick="navigator.clipboard.writeText('abhinyaay@gmail.com').then(() => { this.innerHTML = '<i class=&quot;fas fa-check&quot;></i> Copied!'; setTimeout(() => { this.innerHTML = '<i class=&quot;fas fa-copy&quot;></i> Copy Email'; }, 2000); })" title="Copy email to clipboard">
                    <i class="fas fa-copy"></i>
                    Copy Email
                </button>
            </div>
        `;

        // Remove existing fallback options
        const existingFallback = this.form.querySelector('.fallback-options');
        if (existingFallback) {
            existingFallback.remove();
        }

        // Add new fallback options after the status div
        this.statusDiv.parentNode.insertBefore(fallbackContainer, this.statusDiv.nextSibling);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (fallbackContainer.parentNode) {
                fallbackContainer.remove();
            }
        }, 30000);
    }

    showStatus(type, message) {
        if (!this.statusDiv) return;

        this.statusDiv.className = `form-status ${type}`;
        this.statusDiv.textContent = message;
        this.statusDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                this.statusDiv.style.display = 'none';
            }, 8000);
        } else if (type === 'error') {
            // Keep error messages visible longer
            setTimeout(() => {
                this.statusDiv.style.display = 'none';
            }, 12000);
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PhysicsPortfolio();
    new Navigation();
    new ScrollAnimations();
    new FloatingElements();
    new CursorTrail();
    new ProjectCarousel();
    new ResponsiveProjects();
    new ProjectViewToggle();
    new GridProjectCards();
    new ContactForm();

    // Set dynamic copyright year
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
