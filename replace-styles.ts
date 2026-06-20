import fs from "fs";
import path from "path";

const replaceInFile = (filePath: string) => {
  let content = fs.readFileSync(filePath, "utf-8");

  // App Layout & Base
  content = content.replace(/bg-slate-900\/90 border border-slate-700\/60/g, "glass-card");
  content = content.replace(/bg-slate-905 border border-slate-700\/60/g, "glass-card");
  content = content.replace(/bg-slate-950\/40 border border-slate-700\/60/g, "neu-panel");
  content = content.replace(/bg-slate-950\/80 border border-slate-800/g, "neu-panel");
  content = content.replace(/bg-slate-950\/80 hover:bg-slate-900 border border-slate-800/g, "neu-panel hover:brightness-110");

  // Inputs and sub-boxes
  content = content.replace(/bg-slate-900\/90 hover:bg-slate-950 border border-slate-700\/60/g, "neu-input hover:brightness-110");
  content = content.replace(/bg-slate-950 border border-slate-700\/80/g, "neu-input");
  content = content.replace(/bg-white\/5 border border-white\/15/g, "neu-input");
  content = content.replace(/bg-slate-950\/50 border border-white\/15/g, "neu-input");
  content = content.replace(/bg-slate-900 border border-slate-700\/80/g, "neu-input");
  content = content.replace(/bg-slate-950 border border-slate-700\/60/g, "neu-input");

  // Navs and Headers
  content = content.replace(/bg-slate-900\/60 border border-slate-700\/60/g, "glass-card");

  // Modals
  content = content.replace(/bg-slate-900\/95 border border-white\/20/g, "glass-card");
  content = content.replace(/bg-slate-950\/95 border border-rose-500\/30/g, "glass-card !border-rose-500/50 !shadow-[0_0_30px_rgba(244,63,94,0.3)]");

  // Buttons
  content = content.replace(/bg-slate-800 hover:bg-slate-750 border border-slate-700\/60 hover:border-slate-500/g, "neu-button");
  content = content.replace(/bg-slate-800 hover:bg-slate-700 border border-slate-700/g, "neu-button");
  content = content.replace(/bg-slate-800 hover:bg-slate-700/g, "neu-button");
  content = content.replace(/bg-blue-600 hover:bg-blue-500 border border-blue-500\/50/g, "neu-button-primary");
  content = content.replace(/bg-blue-600 hover:bg-blue-700/g, "neu-button-primary");
  content = content.replace(/bg-rose-600 hover:bg-rose-500 border border-rose-500\/50/g, "neu-button !bg-rose-600/80 !border-rose-500/50 hover:!bg-rose-500");

  content = content.replace(/bg-blue-600/g, "neu-button-primary");
  content = content.replace(/neu-button-primary border-blue-500 text-white shadow-sm/g, "neu-button-primary");
  content = content.replace(/bg-emerald-500 hover:bg-emerald-400 border border-emerald-500\/50/g, "neu-button !bg-emerald-500/80 !border-emerald-500/50");

  // Active / Inactive Tabs
  content = content.replace(/hover:bg-slate-800\/50 text-slate-400 hover:text-slate-200/g, "neu-flat text-slate-400 hover:brightness-125");
  content = content.replace(/bg-slate-800 text-white shadow-sm/g, "neu-button-pressed text-white");

  // Background blur adjustment
  content = content.replace(/backdrop-blur-\[60px\]/g, "backdrop-blur-[24px]");
  content = content.replace(/bg-\[#0B0F19\]\/80/g, "bg-[#0f172a]/60");
  content = content.replace(/bg-\[#0B0F19\]/g, "bg-slate-900");

  fs.writeFileSync(filePath, content, "utf-8");
};

const componentsDir = path.join(process.cwd(), "src/components");
const appTsx = path.join(process.cwd(), "src/App.tsx");

replaceInFile(appTsx);

const files = fs.readdirSync(componentsDir);
files.forEach(file => {
  if (file.endsWith(".tsx")) {
    replaceInFile(path.join(componentsDir, file));
  }
});

console.log("Replaced glassmorphism & neumorphism classes.");
