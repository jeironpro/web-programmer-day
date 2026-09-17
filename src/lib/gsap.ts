// Registro central de GSAP: todos los componentes importan desde aquí
// para que ScrollTrigger se registre exactamente una vez en la aplicación.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
