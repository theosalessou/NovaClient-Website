import {spawnSync} from 'node:child_process';
import path from 'node:path';
const base=import.meta.dirname;
const result=spawnSync(path.join(base,'node_modules/@esbuild/win32-x64/esbuild.exe'),[path.join(base,'src/components.jsx'),'--bundle','--minify','--define:process.env.NODE_ENV="production"',`--outfile=${path.join(base,'../dist/license/dashboard/react-vibe-ui.js')}`],{stdio:'inherit'});process.exit(result.status??1);
