const { execSync } = require('child_process');

function run(cmd) {
    try {
        console.log(`Running: ${cmd}`);
        const out = execSync(cmd, { stdio: 'pipe' }).toString();
        console.log(out);
    } catch (err) {
        if (err.stdout) console.log(err.stdout.toString());
        if (err.stderr) console.error(err.stderr.toString());
    }
}

// 2. Controllers
run('git add backend/src/controllers/device.controller.js backend/src/controllers/reading.controller.js');
run('git commit -m "fix(backend): update device and reading controllers for parent unit support"');

// 3. API, Hooks, Locales
run('git add frontend/src/api/readings.js frontend/src/hooks/index.js frontend/src/locales/en/translation.json frontend/src/locales/ja/translation.json');
run('git commit -m "feat(frontend): update api, hooks, and locales for dual actuator controls"');

// 4. UI Pages and CSS
run('git add frontend/src/components/UI.jsx frontend/src/pages/Controls.jsx frontend/src/pages/Controls.module.css frontend/src/pages/Dashboard.jsx frontend/src/pages/Dashboard.module.css frontend/src/pages/Devices.jsx frontend/src/pages/History.jsx frontend/src/pages/Reports.jsx frontend/src/pages/Sensors.jsx src/pages/Controls.jsx src/pages/Devices.jsx');
run('git commit -m "feat(frontend): redesign dashboard and controls for dual actuators"');

// 5. Any leftover sql
run('git add bioscope_data_backup.sql');
run('git commit -m "chore(backup): update bioscope_data_backup.sql"');

run('git push');
