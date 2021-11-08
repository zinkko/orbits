let setConfig;
let startAnimation;
let stopAnimation;
let createOrbit;

(function () {
    const TAU = 2 * Math.PI;
    const epsilon = 0.0001;
    let K = 40000;
    let starSize = 16;
    let planetSize = 4;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    setConfig = (newConfig) => {
        if (newConfig.K) K = newConfig.K;
        if (newConfig.planetSize) planetSize = newConfig.planetSize;
        if (newConfig.starSize) starSize = newConfig.starSize;
    }

    /**
     * Calculate ellipse parameters for the orbit. Orbit is centered around the main body at the center of the screen
     * 
     * @param a semi-major axis
     * @param e eccentricity
     * @param tilt tilt of the orbit center line
     */
    createOrbit = (a, e, tilt) => {
        const fx = W/2;
        const fy = H/2;
        
        const c = e*a;
        const factor = Math.sqrt((1+e) / (1-e));
        return {
            a,
            b: Math.sqrt(a*a - c*c),
            c,
            e,
            fx,
            fy,
            cx: fx - c * Math.cos(tilt),
            cy: fy - c * Math.sin(tilt),
            tilt,
            t: a * Math.sqrt(a/K),
            getR: function (theta) {
                const numerator = 1 - this.e*this.e;
                const denominator = 1 + this.e*Math.cos(theta);
                return this.a * numerator / denominator;
            },
            calculateEccentricAnomaly: function (M) {
                let estimate = M;
                for (let i=0; i<10; i++) {
                    let old = estimate;
                    const fEstimate = M + this.e * Math.sin(estimate) - estimate;
                    const dfEstimate = this.e * Math.cos(estimate) - 1;
                    estimate = estimate - fEstimate / dfEstimate;
                    if (Math.abs(estimate - old) < epsilon) {
                        break;
                    }
                }
                return estimate % TAU;
            },
            calculateTrueAnomaly: (E) => {
                return 2 * Math.atan(factor * Math.tan(E/2));
                // const y = Math.sqrt(1 - e*e) * Math.sin(E);
                // const x = Math.cos(E) - e;
                // return Math.atan2(y, x);
            },
            mutate: function (newA, newE, newTilt) {
                this.a = newA || this.a;
                this.e = newE || this.e;
                this.tilt = newTilt || this.tilt;
                this.c = this.a * this.e;
                this.b = Math.sqrt(this.a*this.a - this.c * this.c);

                this.cx = fx - this.c * Math.cos(this.tilt);
                this.cy = fy - this.c * Math.sin(this.tilt);
            },
        }
    }

    const draw = (dt, orbits) => {
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = 'darkorange';
        ctx.arc(W/2, H/2, starSize, 0, TAU);
        ctx.fill();
        ctx.closePath();
        
        orbits.forEach((orbit) => drawOrbit(dt, orbit));
    }

    const drawOrbit = (dt, orbit) => {
        const M = TAU * (dt % orbit.t) / orbit.t;
        const E = orbit.calculateEccentricAnomaly(M);
        const nu = orbit.calculateTrueAnomaly(E);
        
        ctx.beginPath();
        ctx.ellipse(orbit.cx, orbit.cy, orbit.a, orbit.b, orbit.tilt, 0, TAU);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.fillStyle = 'black';
        const r = orbit.getR(nu);
        ctx.arc(orbit.fx + r * Math.cos(orbit.tilt + nu), orbit.fy + r * Math.sin(orbit.tilt + nu), planetSize, 0, TAU);
        ctx.fill();
        ctx.closePath();
    }

    let isPlaying = true;
    let animationTime = 0;

    startAnimation = (orbits) => {
        isPlaying = true;
        let last = performance.now();
        const step = () => {
            // seconds since start
            const t = performance.now();

            const dt = (t - last) / 1000;
            last = t;
            animationTime += dt;
            draw(animationTime, orbits);
            if (isPlaying) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    stopAnimation = () => {
        isPlaying = false;
    }
})();