const { execSync } = require('child_process');
const envs = ['production', 'preview', 'development'];
const value = 'Ger25$:Emi25$,Pab26$:Pas25$,Noe26$:Riv26$';

envs.forEach(env => {
  try {
    execSync(`npx vercel env add VITE_ADMIN_CREDENTIALS ${env}`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
  } catch (err) {
    console.error(`Error adding to ${env}:`, err.message);
  }
});
