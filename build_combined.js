const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ADMIN_PATH = path.join(__dirname, 'backup_sentinel', 'sentinel-watch');
const CITIZEN_PATH = path.join(__dirname, 'citizen_dashboard', 'citizen');
const OUTPUT_DIR = path.join(__dirname, 'dist');

// Helper to run commands
const run = (command, cwd, env = {}) => {
    console.log(`> Running: ${command} in ${cwd}`);
    execSync(command, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...env }
    });
};

// Ensure output directory exists
if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUTPUT_DIR);

try {
    // 1. Build Admin
    console.log('--- Building Admin Dashboard ---');
    if (!fs.existsSync(path.join(ADMIN_PATH, 'node_modules'))) {
        run('npm install', ADMIN_PATH);
    }
    run('npm run build -- --base=/admin/', ADMIN_PATH, {
        VITE_API_BASE_URL: process.env.ADMIN_API_URL ? `https://${process.env.ADMIN_API_URL}/api` : undefined
    });

    // Move Admin build
    const adminDist = path.join(ADMIN_PATH, 'dist');
    const adminOutput = path.join(OUTPUT_DIR, 'admin');
    fs.renameSync(adminDist, adminOutput);
    console.log('Admin built and moved to dist/admin');

    // 2. Build Citizen
    console.log('--- Building Citizen Dashboard ---');
    if (!fs.existsSync(path.join(CITIZEN_PATH, 'node_modules'))) {
        run('npm install', CITIZEN_PATH);
    }
    // Citizen uses Vite, check base path
    // We pass --base via CLI to ensure assets load correctly from subdirectory
    run('npm run build -- --base=/citizen/', CITIZEN_PATH, {
        VITE_API_BASE_URL: process.env.CITIZEN_API_URL ? `https://${process.env.CITIZEN_API_URL}/api` : undefined
    });

    // Move Citizen build
    const citizenDist = path.join(CITIZEN_PATH, 'dist');
    const citizenOutput = path.join(OUTPUT_DIR, 'citizen');
    fs.renameSync(citizenDist, citizenOutput);
    console.log('Citizen built and moved to dist/citizen');

    // 3. Setup Landing Page
    const landingSrc = path.join(__dirname, 'landing.html');
    const landingDest = path.join(OUTPUT_DIR, 'index.html');
    if (fs.existsSync(landingSrc)) {
        fs.copyFileSync(landingSrc, landingDest);
        console.log('Landing page copied to dist/index.html');
    } else {
        console.warn('Warning: landing.html not found!');
    }

} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

console.log('--- Build Complete ---');
