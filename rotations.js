let rotations = {
    startAnimation: null,
    stopAnimation: null,
};

(function () {
    const TAU = 2 * Math.PI;
    const epsilon = 0.0001;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const K = 5000;

    /**
     * Calculate ellipse parameters for the orbit. Orbit is centered in the middle of the screen
     * 
     * @param a semi-major axis
     * @param e eccentricity
     * @param tilt tilt of the orbit center line
     */
    const createOrbit = (a, e, tilt) => {
        const cx = W/2;
        const cy = H/2;
        
        const c = e*a;
        const factor = Math.sqrt((1+e) / (1-e));
        return {
            a,
            b: Math.sqrt(a*a - c*c),
            c,
            e,
            fx: cx + c,
            fy: cy,
            cx: W/2,
            cy: H/2,
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
        }
    }

    const orbit = createOrbit(300, 0.7, 0);

    const draw = (dt) => {
        // Focal point, center of orbit
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = 'darkorange';
        ctx.arc(orbit.fx, orbit.fy, 16, 0, TAU);
        ctx.fill();
        ctx.closePath();

        const M = TAU * (dt % orbit.t) / orbit.t;
        const E = orbit.calculateEccentricAnomaly(M);
        const nu = orbit.calculateTrueAnomaly(E);
        
        // enclosing circle
        ctx.beginPath();
        ctx.strokeStyle = 'lightgray';
        ctx.arc(orbit.cx, orbit.cy, orbit.a, 0, TAU);
        ctx.stroke();
        ctx.closePath();

        // orbital arc
        ctx.beginPath();
        ctx.strokeStyle = 'black'
        ctx.ellipse(orbit.cx, orbit.cy, orbit.a, orbit.b, orbit.tilt, 0, TAU);
        ctx.stroke();
        ctx.closePath();

        // Orbital movement
        ctx.beginPath();
        ctx.fillStyle = 'black';
        const r = orbit.getR(nu);
        const orbitalPoint = {
            x: orbit.fx + r * Math.cos(orbit.tilt + nu),
            y: orbit.fy + r * Math.sin(orbit.tilt + nu),
        }
        ctx.arc(orbitalPoint.x, orbitalPoint.y, 4, 0, TAU);
        ctx.fill();
        ctx.closePath();

        // Mean anomaly
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        const meanAnomalyPoint = {
            x: orbit.cx + orbit.a * Math.cos(M),
            y: orbit.cy + orbit.a * Math.sin(M),
        }
        ctx.arc(meanAnomalyPoint.x, meanAnomalyPoint.y, 4, 0, TAU);
        ctx.fill();
        ctx.closePath();

        // Eccentric anomaly
        ctx.beginPath();
        ctx.fillStyle = 'green';
        const eccentricAnomalyPoint = {
            x: orbit.cx + orbit.a * Math.cos(E),
            y: orbit.cy + orbit.a * Math.sin(E),
        }
        ctx.arc(eccentricAnomalyPoint.x, eccentricAnomalyPoint.y, 4, 0, TAU);
        ctx.fill();
        ctx.closePath();

        // Lines
        ctx.beginPath();
        ctx.strokeStyle = 'lightgray';

        // Major axis;
        ctx.moveTo(orbit.cx + orbit.a, orbit.cy);
        ctx.lineTo(orbit.cx - orbit.a, orbit.cy);
        
        // e - nu - line
        ctx.moveTo(eccentricAnomalyPoint.x, eccentricAnomalyPoint.y);
        ctx.lineTo(eccentricAnomalyPoint.x, orbit.cy);

        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.arc(orbit.cx, orbit.cy, 30, 0, M);
        ctx.moveTo(orbit.cx, orbit.cy);
        ctx.lineTo(meanAnomalyPoint.x, meanAnomalyPoint.y);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.arc(orbit.cx, orbit.cy, 20, 0, E);
        ctx.moveTo(orbit.cx, orbit.cy);
        ctx.lineTo(eccentricAnomalyPoint.x, eccentricAnomalyPoint.y);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.arc(orbit.fx, orbit.fy, 20, 0, nu);
        ctx.moveTo(orbit.fx, orbit.fy);
        ctx.lineTo(orbitalPoint.x, orbitalPoint.y);
        ctx.stroke();
        ctx.closePath();
    }

    let isPlaying = true;
    let animationTime = 0;

    rotations.startAnimation = () => {
        isPlaying = true;
        let last = performance.now();
        const step = () => {
            // seconds since start
            const t = performance.now();

            const dt = (t - last) / 1000;
            last = t;
            animationTime += dt;
            draw(animationTime);
            if (isPlaying) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    rotations.stopAnimation = () => {
        isPlaying = false;
    }
})();