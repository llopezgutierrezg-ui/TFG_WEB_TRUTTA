import './styles/base.css';
import './styles/sections.css';
import './styles/mobile.css';
import { App } from './core/App.js';

new App().init().catch(err => console.error('[TRUTTA] boot failed', err));
