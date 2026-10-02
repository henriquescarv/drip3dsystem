import { useState } from "react";
import {
  Printer, Package, AlertTriangle, Home, Bell, X,
  DollarSign, Percent, Box, BarChart2, Settings,
  Wrench, RefreshCw, Shield, Sliders, Plus,
  ChevronRight, ChevronDown, Calendar, Clock, CheckCircle, Layers,
  ExternalLink, ShoppingCart, Minus, Tag, TrendingUp,
  Calculator, ArrowRight, FileText, Users,
  Search, Mail, Phone, MapPin,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, ZAxis, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Toaster, toast } from "sonner";

/* ══ Types ═══════════════════════════════════════════════════════ */

type KStatus   = "imprimindo" | "acabamento" | "embalagem" | "prontos";
type PStatus   = "ativa" | "manutencao" | "inativa";
type MType     = "preventiva" | "corretiva" | "troca" | "calibracao";
type ModelCat  = "Mecânico" | "Decorativo" | "Funcional" | "Protótipo" | "Arquitetura" | "Arte";

interface Job {
  id: string; order: string; part: string; material: string;
  printer: string; status: KStatus; progress?: number;
  eta?: string; client: string; dot: string; urgent?: boolean;
}
interface MEvent {
  id: string; date: string; type: MType;
  desc: string; cost?: number; dur?: string;
}
interface PM {
  id: string; name: string; model: string; brand: string;
  acquired: string; vol: { x: number; y: number; z: number };
  cph: number; mats: string[]; status: PStatus;
  lifeHours: number; hours: number; uptime: number;
  valorPago: number; potenciaW: number;
  next: string; history: MEvent[];
}
interface UEntry { id: string; date: string; grams: number; job?: string; }
type CustomFieldType = "opcoes" | "numerico" | "aberto" | "monetario" | "data" | "cor";

interface CustomMaterialField {
  id: string;
  name: string;
  type: CustomFieldType;
  value?: string;
  options?: string[];
  allowMultiple?: boolean;
  required?: boolean;
}

interface Filament {
  id: string; material: string; brand: string;
  color: string; colorHex: string;
  diameter: 1.75 | 2.85;
  initial: number; current: number;
  costPerKg: number;
  printers: string[];
  openedAt: string;
  buyLink?: string;
  usage: UEntry[];
  customFields?: CustomMaterialField[];
}
interface CaixaItem {
  id: string;
  name: string;
  dims?: { l: number; c: number; a: number };
  initial: number;
  current: number;
  costPerUnit: number;
  addedAt: string;
  buyLink?: string;
  customFields?: CustomMaterialField[];
}
interface SliceConfig {
  layer: 0.1 | 0.2 | 0.3;
  infill: number;
  support: boolean;
  walls: number;
}
interface PrintModel {
  id: string; name: string; desc: string;
  category: ModelCat; tags: string[];
  dims: { x: number; y: number; z: number };
  volume: number;
  estimatedTime: number;
  slice: SliceConfig;
  materialType: string;
  printCount: number;
  sellPrice: number;
  featured: boolean;
  thumbH: number;
  accent: string;
  svgKey: string;
}
type OrderStatus = "orcamento" | "confirmado" | "na_fila" | "imprimindo" | "pronto" | "entregue" | "cancelado";
type PayMethod   = "pix" | "cartao" | "boleto" | "dinheiro";
interface OrderItem { id: string; model: string; qty: number; material: string; color: string; colorHex: string; unitPrice: number; }
interface Order {
  id: string; num: string; client: string; initials: string; avatarColor: string;
  items: OrderItem[]; deadline: Date; status: OrderStatus;
  payment: PayMethod; total: number; deposit: number; notes?: string;
  createdAt: Date; progress?: number;
}

type ClientTag = "vip" | "atacado" | "novo" | "inativo" | "problematico";
interface ClientOrderRef { num: string; date: Date; total: number; status: OrderStatus; }
interface Client {
  id: string; name: string; initials: string; avatarColor: string;
  email: string; phone: string;
  address?: { street: string; city: string; state: string };
  tags: ClientTag[]; notes?: string; preferences?: string;
  ltv: number; orders: ClientOrderRef[];
}

/* ══ Heatmap ═════════════════════════════════════════════════════ */

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const TODAY = new Date(2026, 7, 15);
const HEATMAP = (() => {
  const W = 22, base = new Date(TODAY);
  base.setDate(TODAY.getDate() - TODAY.getDay() - (W - 1) * 7);
  return Array.from({ length: W }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(base);
      date.setDate(base.getDate() + w * 7 + d);
      const future = date > TODAY, r = sr(w * 7 + d + 7), isWe = d === 0 || d === 6;
      let v = 0;
      if (!future) {
        if (isWe) v = r < 0.55 ? 0 : Math.floor(r * 4 + 1);
        else if (d === 1) v = Math.floor(r * 6 + 1);
        else v = Math.floor(r * 8 + 2);
        if (r < 0.05) v = 0;
      }
      return { date, v, future };
    })
  );
})();
const MPT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DA  = ["D","S","T","Q","Q","S","S"];
const monthAt = (wi: number) => { const d = HEATMAP[wi]?.[0]?.date; return d && d.getDate() <= 7 ? MPT[d.getMonth()] : null; };
const hc = (v: number, f: boolean) => { if (f || v === 0) return "#1c1f2e"; if (v <= 2) return "#1e3a5f"; if (v <= 4) return "#1d4ed8"; if (v <= 6) return "#2563eb"; if (v <= 8) return "#3b82f6"; return "#60a5fa"; };

/* ══ Dashboard data ══════════════════════════════════════════════ */

const KPIS = [
  { label:"Pedidos no período",     value:"38",         sub:"+5 vs período anterior",   Icon:ShoppingCart, accent:"#3b82f6", bg:"rgba(59,130,246,0.12)"  },
  { label:"Faturamento no período", value:"R$ 18.420",  sub:"+12% vs período anterior", Icon:DollarSign,   accent:"#10b981", bg:"rgba(16,185,129,0.12)"  },
  { label:"Lucro final",        value:"R$ 10.644",  sub:"após custos e overhead",Icon:TrendingUp,   accent:"#f59e0b", bg:"rgba(245,158,11,0.12)"  },
  { label:"Margem média",       value:"57,8%",       sub:"+3 pp vs mês ant.",    Icon:Percent,      accent:"#a78bfa", bg:"rgba(167,139,250,0.12)" },
];
const FILS_D = [
  { name:"PLA Branco",       brand:"Polymaker", g:180,  max:1000 },
  { name:"PLA Preto",        brand:"Bambu Lab", g:650,  max:1000 },
  { name:"PETG Transp.",     brand:"Prusament", g:340,  max:1000 },
  { name:"ABS Cinza",        brand:"eSUN",      g:820,  max:1000 },
  { name:"TPU Flexível",     brand:"Sunlu",     g:210,  max:500  },
  { name:"PLA+ Vermelho",    brand:"eSUN",      g:90,   max:1000 },
  { name:"PETG Preto",       brand:"Bambu Lab", g:530,  max:1000 },
  { name:"PLA Cinza",        brand:"Polymaker", g:760,  max:1000 },
  { name:"ASA Branco",       brand:"eSUN",      g:440,  max:1000 },
  { name:"Resina Standard",  brand:"Elegoo",    g:380,  max:500  },
  { name:"TPU 95A Preto",    brand:"Sunlu",     g:55,   max:500  },
  { name:"PLA Madeira",      brand:"eSUN",      g:290,  max:500  },
  { name:"PETG Vermelho",    brand:"Prusament", g:670,  max:1000 },
  { name:"PLA Azul",         brand:"Bambu Lab", g:120,  max:1000 },
  { name:"Nylon PA12",       brand:"Polymaker", g:310,  max:500  },
  { name:"PLA+ Laranja",     brand:"eSUN",      g:480,  max:1000 },
  { name:"PLA Silk Gold",    brand:"Sunlu",     g:35,   max:500  },
  { name:"ABS Preto",        brand:"Bambu Lab", g:900,  max:1000 },
  { name:"PETG Azul",        brand:"Prusament", g:150,  max:1000 },
  { name:"Resina ABS-Like",  brand:"Elegoo",    g:200,  max:500  },
];
const INIT_JOBS: Job[] = [
  { id:"1", order:"#047", part:"Suporte ergonômico",     material:"PLA Branco",   printer:"Bambu X1C",   status:"imprimindo", progress:67, eta:"2h 14m", client:"MakerShop SP",    dot:"#3b82f6", urgent:true  },
  { id:"2", order:"#048", part:"Tampa caixa elétrica",   material:"PETG Transp.", printer:"Prusa MK4",   status:"imprimindo", progress:23, eta:"5h 40m", client:"Eletrotec Ltda",  dot:"#a78bfa"              },
  { id:"3", order:"#045", part:"Protótipo de garra",     material:"ABS Cinza",    printer:"Bambu X1C",   status:"imprimindo", progress:88, eta:"0h 32m", client:"RoboLab UFMG",   dot:"#10b981", urgent:true  },
  { id:"4", order:"#044", part:"Peça reposição CNC",     material:"PLA Preto",    printer:"Ender 5 Pro", status:"acabamento",                             client:"FabLab Curitiba", dot:"#f59e0b"              },
  { id:"5", order:"#043", part:"Suporte câmera",         material:"PETG",         printer:"Bambu P1S",   status:"acabamento",                             client:"Studio Noir",     dot:"#f43f5e", urgent:true  },
  { id:"6", order:"#042", part:"Miniatura colecionável", material:"PLA+ Verm.",   printer:"Bambu P1S",   status:"embalagem",                              client:"Geek Store BH",   dot:"#fb923c"              },
  { id:"7", order:"#040", part:"Case customizado",       material:"PLA Preto",    printer:"Bambu X1C",   status:"prontos",                                client:"Nexus Tech",      dot:"#14b8a6"              },
  { id:"8", order:"#039", part:"Placa de sinalização",   material:"PETG Branco",  printer:"Prusa MK4",   status:"prontos",                                client:"Loja Virtual SP", dot:"#06b6d4"              },
];
const ALERTS_D = [
  { id:1, sev:"critical" as const, text:"Filamento PLA Branco abaixo de 200g — reabastecimento urgente" },
  { id:2, sev:"warning"  as const, text:"Pedido #047 com entrega atrasada em 1 dia"                     },
  { id:3, sev:"critical" as const, text:"PLA+ Vermelho em nível crítico — apenas 90g restantes"         },
  { id:4, sev:"info"     as const, text:"Bambu X1C: manutenção preventiva recomendada em 3 dias"        },
];
const KCOLS: { id: KStatus; label: string; accent: string }[] = [
  { id:"imprimindo", label:"Imprimindo", accent:"#3b82f6" },
  { id:"acabamento", label:"Acabamento", accent:"#f59e0b" },
  { id:"embalagem",  label:"Embalagem",  accent:"#a78bfa" },
  { id:"prontos",    label:"Prontos",    accent:"#10b981" },
];

/* ══ Printers data ═══════════════════════════════════════════════ */

const printerHealth = (p: PM) => Math.max(0, Math.round((1 - p.hours / p.lifeHours) * 100));
const PRINTERS: PM[] = [
  { id:"p1", name:"Bambu X1 Carbon", model:"X1 Carbon",   brand:"Bambu Lab",     acquired:"Mar 2024", vol:{x:256,y:256,z:256}, cph:4.20, mats:["PLA","PETG","ABS","TPU","PA","PC"],       status:"ativa",      lifeHours:10000, hours:1847, uptime:98.2, valorPago:7200, potenciaW:350, next:"15 Set 2026",          history:[{ id:"h1", date:"Jan 2026", type:"troca",      desc:"Troca de nozzle 0.4mm",                     cost:45,  dur:"2h"          },{ id:"h2", date:"Mar 2026", type:"preventiva", desc:"Limpeza da câmara e lubrificação dos eixos", cost:0,   dur:"3h"          },{ id:"h3", date:"Jun 2026", type:"troca",      desc:"Substituição da placa de impressão PEI",     cost:120, dur:"1h"          }] },
  { id:"p2", name:"Prusa MK4",       model:"MK4",          brand:"Prusa Research",acquired:"Jan 2023", vol:{x:250,y:210,z:220}, cph:3.60, mats:["PLA","PETG","ASA","Flex"],            status:"ativa",      lifeHours:10000, hours:3214, uptime:99.1, valorPago:2600, potenciaW:240, next:"02 Nov 2026",          history:[{ id:"h1", date:"Out 2025", type:"preventiva", desc:"Revisão geral e calibração de 1ª camada",   cost:0,   dur:"4h"          },{ id:"h2", date:"Fev 2026", type:"calibracao", desc:"Atualização de firmware e recalibração",    cost:0,   dur:"1h"          },{ id:"h3", date:"Ago 2026", type:"troca",      desc:"Troca do extrusor Nextruder",               cost:280, dur:"3h"          }] },
  { id:"p3", name:"Ender 5 Pro",     model:"Ender-5 Pro",  brand:"Creality",     acquired:"Nov 2021", vol:{x:235,y:235,z:300}, cph:2.80, mats:["PLA","PETG"],                          status:"manutencao", lifeHours:6000,  hours:4892, uptime:87.4, valorPago:1200, potenciaW:220, next:"Previsto: 22 Ago 2026", history:[{ id:"h1", date:"Ago 2025", type:"troca",      desc:"Substituição do eixo Y e correia",          cost:95,  dur:"5h"          },{ id:"h2", date:"Nov 2025", type:"preventiva", desc:"Preventiva geral pré-temporada alta",       cost:0,   dur:"3h"          },{ id:"h3", date:"Jul 2026", type:"corretiva",  desc:"Falha no aquecedor — em reparo",            cost:75,  dur:"Em andamento" }] },
  { id:"p4", name:"Bambu P1S",       model:"P1S",          brand:"Bambu Lab",    acquired:"Set 2024", vol:{x:256,y:256,z:256}, cph:3.90, mats:["PLA","PETG","ABS","ASA","TPU","PA-CF"], status:"ativa",      lifeHours:10000, hours:986,  uptime:97.8, valorPago:5500, potenciaW:350, next:"10 Out 2026",          history:[{ id:"h1", date:"Jan 2026", type:"calibracao", desc:"Calibração de fluxo por material",          cost:0,   dur:"2h"          },{ id:"h2", date:"Jul 2026", type:"preventiva", desc:"Limpeza e inspeção semestral",              cost:0,   dur:"2h 30min"    }] },
  { id:"p5", name:"CR-10S Pro",      model:"CR-10S Pro",   brand:"Creality",     acquired:"Jun 2020", vol:{x:300,y:300,z:400}, cph:3.20, mats:["PLA","PETG"],                          status:"inativa",    lifeHours:8000,  hours:7230, uptime:74.1, valorPago:2200, potenciaW:360, next:"Aguardando decisão",   history:[{ id:"h1", date:"Jun 2025", type:"corretiva",  desc:"Substituição da placa-mãe 32-bit",          cost:320, dur:"8h"          },{ id:"h2", date:"Out 2025", type:"troca",      desc:"Troca de hot-end all-metal",                cost:180, dur:"4h"          },{ id:"h3", date:"Fev 2026", type:"corretiva",  desc:"Falha sensor de nível — desativada",        cost:0,   dur:"Pendente"     }] },
  { id:"p6", name:"Bambu A1 Mini",   model:"A1 Mini Combo",brand:"Bambu Lab",    acquired:"Mai 2026", vol:{x:180,y:180,z:180}, cph:3.10, mats:["PLA","PETG","TPU"],                    status:"ativa",      lifeHours:8000,  hours:312,  uptime:99.8, valorPago:2800, potenciaW:250, next:"Nov 2026",             history:[] },
];

/* ══ Filaments data ══════════════════════════════════════════════ */

const MAT_ORDER = ["PLA","PLA+","PETG","ABS","ASA","TPU"];
const MAT_COLOR: Record<string, string> = {
  "PLA":"#3b82f6", "PLA+":"#a78bfa", "PETG":"#10b981", "ABS":"#f59e0b", "ASA":"#f97316", "TPU":"#06b6d4",
};

const INIT_FILAMENTS: Filament[] = [
  { id:"m1",  material:"PLA",  brand:"Polymaker",  color:"Branco",       colorHex:"#F0EDE8", diameter:1.75, initial:1000, current:180, costPerKg:95,  printers:["Bambu X1C","Prusa MK4"],         openedAt:"12 Mar 2026", buyLink:"https://amazon.com.br", usage:[{ id:"u1", date:"10 Ago 2026", grams:85,  job:"Pedido #045" },{ id:"u2", date:"08 Ago 2026", grams:120, job:"Pedido #043" },{ id:"u3", date:"01 Ago 2026", grams:145, job:"Pedido #041" }] },
  { id:"m2",  material:"PLA+", brand:"eSUN",       color:"Vermelho",     colorHex:"#C0392B", diameter:1.75, initial:1000, current:90,  costPerKg:85,  printers:["Bambu X1C","Bambu P1S"],         openedAt:"05 Fev 2026", buyLink:"https://amazon.com.br", usage:[{ id:"u1", date:"09 Ago 2026", grams:210, job:"Pedido #042" },{ id:"u2", date:"25 Jul 2026", grams:340, job:"Pedido #038" }] },
  { id:"m3",  material:"PETG", brand:"Prusament",  color:"Transparente", colorHex:"#B4D4DA", diameter:1.75, initial:1000, current:340, costPerKg:130, printers:["Prusa MK4","Bambu P1S"],         openedAt:"01 Abr 2026", usage:[{ id:"u1", date:"07 Ago 2026", grams:95, job:"Pedido #044" }] },
  { id:"m4",  material:"TPU",  brand:"Sunlu",      color:"Natural Flex", colorHex:"#E8E0C8", diameter:1.75, initial:500,  current:210, costPerKg:160, printers:["Bambu X1C","Bambu P1S"],         openedAt:"20 Jan 2026", usage:[{ id:"u1", date:"05 Ago 2026", grams:45, job:"Pedido #043" }] },
  { id:"m5",  material:"PLA",  brand:"Bambu Lab",  color:"Preto",        colorHex:"#1A1A2E", diameter:1.75, initial:1000, current:650, costPerKg:89,  printers:["Bambu X1C","Bambu P1S","Ender 5 Pro"], openedAt:"10 Mai 2026", usage:[{ id:"u1", date:"11 Ago 2026", grams:75, job:"Pedido #047" },{ id:"u2", date:"09 Ago 2026", grams:140, job:"Pedido #045" }] },
  { id:"m6",  material:"ABS",  brand:"eSUN",       color:"Cinza",        colorHex:"#6B7280", diameter:1.75, initial:1000, current:820, costPerKg:75,  printers:["Bambu X1C"],                     openedAt:"15 Abr 2026", usage:[{ id:"u1", date:"08 Ago 2026", grams:180, job:"Pedido #045" }] },
  { id:"m7",  material:"PLA",  brand:"Hatchbox",   color:"Azul Marinho", colorHex:"#1E3A5F", diameter:1.75, initial:1000, current:760, costPerKg:78,  printers:["Prusa MK4","Ender 5 Pro"],       openedAt:"22 Mai 2026", usage:[{ id:"u1", date:"10 Ago 2026", grams:90, job:"Pedido #046" }] },
  { id:"m8",  material:"PETG", brand:"Bambu Lab",  color:"Verde",        colorHex:"#22C55E", diameter:1.75, initial:1000, current:510, costPerKg:92,  printers:["Bambu X1C","Bambu P1S"],         openedAt:"18 Jun 2026", usage:[] },
  { id:"m9",  material:"ASA",  brand:"Polymaker",  color:"Branco Gelo",  colorHex:"#E8EFF5", diameter:1.75, initial:1000, current:630, costPerKg:120, printers:["Bambu X1C"],                     openedAt:"02 Jul 2026", usage:[{ id:"u1", date:"06 Ago 2026", grams:130, job:"Pedido #043" }] },
  { id:"m10", material:"PLA+", brand:"eSUN",       color:"Amarelo",      colorHex:"#EAB308", diameter:1.75, initial:1000, current:880, costPerKg:85,  printers:["Bambu X1C","Bambu P1S","Prusa MK4"], openedAt:"01 Ago 2026", usage:[] },
  { id:"m11", material:"PETG", brand:"Prusament",  color:"Laranja",      colorHex:"#F97316", diameter:1.75, initial:1000, current:440, costPerKg:130, printers:["Prusa MK4"],                     openedAt:"14 Jun 2026", usage:[{ id:"u1", date:"12 Ago 2026", grams:60, job:"Pedido #048" }] },
  { id:"m12", material:"PLA",  brand:"Bambu Lab",  color:"Roxo",         colorHex:"#7C3AED", diameter:1.75, initial:1000, current:920, costPerKg:89,  printers:["Bambu X1C","Bambu P1S"],         openedAt:"10 Ago 2026", usage:[] },
  { id:"m13", material:"ABS",  brand:"Hatchbox",   color:"Preto",        colorHex:"#111827", diameter:1.75, initial:1000, current:550, costPerKg:72,  printers:["Bambu X1C","Ender 5 Pro"],       openedAt:"28 Mai 2026", usage:[{ id:"u1", date:"09 Ago 2026", grams:220, job:"Pedido #044" }] },
  { id:"m14", material:"TPU",  brand:"Sunlu",      color:"Vermelho",     colorHex:"#DC2626", diameter:1.75, initial:500,  current:420, costPerKg:160, printers:["Bambu X1C","Bambu P1S"],         openedAt:"15 Jul 2026", usage:[] },
];

/* ══ Caixas data ═════════════════════════════════════════════════ */

const BOX_TYPE_OPTIONS = ["Conrugado", "Kraft", "Rígida"] as const;

function inferBoxTypeFromName(name: string): (typeof BOX_TYPE_OPTIONS)[number] {
  if (/kraft/i.test(name)) return "Kraft";
  if (/rígida|rigida/i.test(name)) return "Rígida";
  return "Conrugado";
}

function getBoxCustomFields(b: CaixaItem): CustomMaterialField[] {
  const typeValue = b.customFields?.find(field => field.name === "Tipo")?.value ?? inferBoxTypeFromName(b.name);
  const alturaMm = Math.round((b.dims?.a ?? 0) * 10);
  const larguraMm = Math.round((b.dims?.l ?? 0) * 10);
  const profundidadeMm = Math.round((b.dims?.c ?? 0) * 10);

  return [
    {
      id: `box-type-${b.id}`,
      name: "Tipo",
      type: "opcoes",
      value: typeValue,
      options: [...BOX_TYPE_OPTIONS],
      required: true,
    },
    {
      id: `box-altura-${b.id}`,
      name: "Altura (mm)",
      type: "numerico",
      value: `${alturaMm}`,
      required: true,
    },
    {
      id: `box-largura-${b.id}`,
      name: "Largura (mm)",
      type: "numerico",
      value: `${larguraMm}`,
      required: true,
    },
    {
      id: `box-profundidade-${b.id}`,
      name: "Profundidade (mm)",
      type: "numerico",
      value: `${profundidadeMm}`,
      required: true,
    },
  ];
}

function getBoxFieldValue(b: CaixaItem, fieldName: string): number {
  const field = (b.customFields && b.customFields.length > 0 ? b.customFields : getBoxCustomFields(b)).find(item => item.name === fieldName);
  const parsed = Number(field?.value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getBoxTypeValue(b: CaixaItem): (typeof BOX_TYPE_OPTIONS)[number] {
  const field = (b.customFields && b.customFields.length > 0 ? b.customFields : getBoxCustomFields(b)).find(item => item.name === "Tipo");
  const value = field?.value ?? inferBoxTypeFromName(b.name);
  return BOX_TYPE_OPTIONS.includes(value as (typeof BOX_TYPE_OPTIONS)[number]) ? (value as (typeof BOX_TYPE_OPTIONS)[number]) : "Conrugado";
}

function getBoxStockLevel(b: CaixaItem): "ok" | "baixo" | "critico" {
  const pct = b.initial > 0 ? b.current / b.initial : 0;
  if (pct < 0.1) return "critico";
  if (pct < 0.4) return "baixo";
  return "ok";
}

const INIT_CAIXAS: CaixaItem[] = [
  { id:"b1", name:"Caixa 10×10×10 cm",    dims:{l:10,c:10,a:10}, initial:200, current:12, costPerUnit:1.20, addedAt:"10 Jan 2026", buyLink:"https://amazon.com.br", customFields:getBoxCustomFields({ id:"b1", name:"Caixa 10×10×10 cm", dims:{l:10,c:10,a:10}, initial:200, current:12, costPerUnit:1.20, addedAt:"10 Jan 2026", buyLink:"https://amazon.com.br" }) },
  { id:"b2", name:"Caixa 15×15×10 cm",    dims:{l:15,c:15,a:10}, initial:150, current:47, costPerUnit:1.80, addedAt:"10 Jan 2026", customFields:getBoxCustomFields({ id:"b2", name:"Caixa 15×15×10 cm", dims:{l:15,c:15,a:10}, initial:150, current:47, costPerUnit:1.80, addedAt:"10 Jan 2026" }) },
  { id:"b3", name:"Caixa 20×20×15 cm",    dims:{l:20,c:20,a:15}, initial:100, current:38, costPerUnit:2.90, addedAt:"15 Fev 2026", customFields:getBoxCustomFields({ id:"b3", name:"Caixa 20×20×15 cm", dims:{l:20,c:20,a:15}, initial:100, current:38, costPerUnit:2.90, addedAt:"15 Fev 2026" }) },
  { id:"b4", name:"Caixa 30×25×20 cm",    dims:{l:30,c:25,a:20}, initial:50,  current:22, costPerUnit:4.50, addedAt:"15 Fev 2026", buyLink:"https://amazon.com.br", customFields:getBoxCustomFields({ id:"b4", name:"Caixa 30×25×20 cm", dims:{l:30,c:25,a:20}, initial:50, current:22, costPerUnit:4.50, addedAt:"15 Fev 2026", buyLink:"https://amazon.com.br" }) },
  { id:"b5", name:"Kraft P (12×8×6 cm)",  dims:{l:12,c:8,a:6},  initial:300, current:8,  costPerUnit:0.85, addedAt:"05 Mar 2026", buyLink:"https://amazon.com.br", customFields:getBoxCustomFields({ id:"b5", name:"Kraft P (12×8×6 cm)", dims:{l:12,c:8,a:6}, initial:300, current:8, costPerUnit:0.85, addedAt:"05 Mar 2026", buyLink:"https://amazon.com.br" }) },
  { id:"b6", name:"Kraft M (20×14×10 cm)",dims:{l:20,c:14,a:10}, initial:150, current:64, costPerUnit:1.60, addedAt:"05 Mar 2026", customFields:getBoxCustomFields({ id:"b6", name:"Kraft M (20×14×10 cm)", dims:{l:20,c:14,a:10}, initial:150, current:64, costPerUnit:1.60, addedAt:"05 Mar 2026" }) },
  { id:"b7", name:"Kraft G (30×22×15 cm)",dims:{l:30,c:22,a:15}, initial:80,  current:31, costPerUnit:2.80, addedAt:"20 Mar 2026", customFields:getBoxCustomFields({ id:"b7", name:"Kraft G (30×22×15 cm)", dims:{l:30,c:22,a:15}, initial:80, current:31, costPerUnit:2.80, addedAt:"20 Mar 2026" }) },
  { id:"b8", name:"Rígida Premium P",     dims:{l:15,c:12,a:8},  initial:60,  current:19, costPerUnit:6.50, addedAt:"01 Abr 2026", buyLink:"https://amazon.com.br", customFields:getBoxCustomFields({ id:"b8", name:"Rígida Premium P", dims:{l:15,c:12,a:8}, initial:60, current:19, costPerUnit:6.50, addedAt:"01 Abr 2026", buyLink:"https://amazon.com.br" }) },
];

/* ══ Catalog / Models data ═══════════════════════════════════════ */

const CAT_COLOR: Record<ModelCat, string> = {
  "Mecânico":   "#3b82f6",
  "Decorativo": "#a78bfa",
  "Funcional":  "#10b981",
  "Protótipo":  "#f59e0b",
  "Arquitetura":"#94a3b8",
  "Arte":       "#f43f5e",
};

const MODELS: PrintModel[] = [
  {
    id:"md1", name:"Engrenagem Helicoidal", desc:"Engrenagem helicoidal para transmissão de torque com dentes de 20°. Compatível com padrão DIN 3975. Tolerâncias de ±0.1mm.",
    category:"Mecânico", tags:["engrenagem","transmissão","DIN"],
    dims:{x:80,y:80,z:20}, volume:28.4, estimatedTime:3.2,
    slice:{layer:0.2,infill:80,support:false,walls:4},
    materialType:"PLA+", printCount:47, sellPrice:85.00, featured:true, thumbH:190, accent:"#3b82f6", svgKey:"gear",
  },
  {
    id:"md2", name:"Vaso Paramétrico Twist", desc:"Vaso decorativo com torção helicoidal de 180°. Impresso em vase mode sem infill para translucidez e estética única.",
    category:"Decorativo", tags:["vaso","decorativo","paramétrico"],
    dims:{x:95,y:95,z:220}, volume:38.0, estimatedTime:5.8,
    slice:{layer:0.2,infill:0,support:false,walls:2},
    materialType:"PLA", printCount:23, sellPrice:65.00, featured:false, thumbH:210, accent:"#a78bfa", svgKey:"vase",
  },
  {
    id:"md3", name:"Suporte Monitor 27\"", desc:"Suporte articulado para monitor de 27\" com passagem de cabos integrada. Fixação VESA 75×75 e 100×100mm.",
    category:"Funcional", tags:["suporte","monitor","VESA","desk"],
    dims:{x:180,y:90,z:55}, volume:62.8, estimatedTime:7.5,
    slice:{layer:0.2,infill:50,support:true,walls:4},
    materialType:"PLA+", printCount:62, sellPrice:140.00, featured:true, thumbH:170, accent:"#10b981", svgKey:"bracket",
  },
  {
    id:"md4", name:"Case Raspberry Pi 4", desc:"Enclosure ventilado com suporte para fan de 30mm e acesso a todas as portas. Impressão em 3 partes encaixáveis sem parafusos.",
    category:"Funcional", tags:["RPi","case","eletrônica"],
    dims:{x:100,y:75,z:38}, volume:22.5, estimatedTime:4.1,
    slice:{layer:0.2,infill:30,support:false,walls:3},
    materialType:"PLA", printCount:31, sellPrice:55.00, featured:false, thumbH:175, accent:"#10b981", svgKey:"box",
  },
  {
    id:"md5", name:"Miniatura Casa Colonial", desc:"Réplica arquitetônica de casa colonial mineira em escala 1:87. Detalhes de telhas, janelas e porta trabalhados.",
    category:"Arquitetura", tags:["arquitetura","miniatura","colonial"],
    dims:{x:60,y:45,z:50}, volume:18.2, estimatedTime:6.4,
    slice:{layer:0.1,infill:20,support:true,walls:2},
    materialType:"PLA", printCount:8, sellPrice:120.00, featured:false, thumbH:185, accent:"#94a3b8", svgKey:"arch",
  },
  {
    id:"md6", name:"Peão de Xadrez Oversize", desc:"Peão de xadrez em tamanho decorativo (altura 14cm). Acabamento liso para pintura. Base com peso de metal inserível.",
    category:"Arte", tags:["xadrez","decorativo","jogo"],
    dims:{x:55,y:55,z:140}, volume:31.6, estimatedTime:4.8,
    slice:{layer:0.1,infill:20,support:false,walls:3},
    materialType:"PLA", printCount:19, sellPrice:75.00, featured:false, thumbH:210, accent:"#f43f5e", svgKey:"pawn",
  },
  {
    id:"md7", name:"Suporte GoPro HERO", desc:"Suporte universal para GoPro HERO 9/10/11 com articulação de 360° e encaixe padrão 1/4\". Compatível com tripés.",
    category:"Mecânico", tags:["GoPro","câmera","suporte"],
    dims:{x:65,y:40,z:90}, volume:19.8, estimatedTime:2.9,
    slice:{layer:0.2,infill:60,support:true,walls:4},
    materialType:"PETG", printCount:28, sellPrice:95.00, featured:false, thumbH:175, accent:"#3b82f6", svgKey:"mount",
  },
  {
    id:"md8", name:"Organizador de Cabos", desc:"Gancho adesivo para organização de cabos USB, HDMI e carregadores. Encaixa em painéis perfurados de 25mm.",
    category:"Funcional", tags:["organização","cabo","desk"],
    dims:{x:45,y:30,z:40}, volume:8.4, estimatedTime:1.2,
    slice:{layer:0.2,infill:40,support:false,walls:3},
    materialType:"PLA", printCount:41, sellPrice:18.00, featured:true, thumbH:160, accent:"#10b981", svgKey:"hook",
  },
  {
    id:"md9", name:"Porta-Canetas Hexagonal", desc:"Organizador de mesa em grade hexagonal modular. Cada célula comporta canetas, tesouras e réguas. Encaixe magnético.",
    category:"Decorativo", tags:["organização","mesa","hexagonal"],
    dims:{x:120,y:104,z:90}, volume:44.2, estimatedTime:6.2,
    slice:{layer:0.2,infill:20,support:false,walls:3},
    materialType:"PLA", printCount:15, sellPrice:85.00, featured:false, thumbH:170, accent:"#a78bfa", svgKey:"hex",
  },
  {
    id:"md10", name:"Protetor de Quina", desc:"Protetor anti-impacto para quinas de mesas e móveis. Borracha TPU com fixação por fita 3M inclusa. Par de proteção.",
    category:"Funcional", tags:["segurança","protetor","TPU"],
    dims:{x:35,y:35,z:35}, volume:5.6, estimatedTime:0.8,
    slice:{layer:0.3,infill:50,support:false,walls:4},
    materialType:"TPU", printCount:54, sellPrice:22.00, featured:true, thumbH:155, accent:"#10b981", svgKey:"corner",
  },
  {
    id:"md11", name:"Suporte Celular Bike", desc:"Suporte ajustável para celular em guidão de bicicleta. Compatível com guidões de 22mm a 35mm. Trava anti-vibração.",
    category:"Mecânico", tags:["bicicleta","celular","outdoor"],
    dims:{x:85,y:60,z:55}, volume:21.3, estimatedTime:3.5,
    slice:{layer:0.2,infill:60,support:false,walls:4},
    materialType:"PETG", printCount:37, sellPrice:48.00, featured:false, thumbH:180, accent:"#3b82f6", svgKey:"phonestand",
  },
  {
    id:"md12", name:"Monograma 3D \"FAB\"", desc:"Letras tridimensionais em relevo para sinalização de fablabs e estúdios. Altura 8cm, espessura 1.5cm. Fixação por adesivo.",
    category:"Arte", tags:["lettering","sinalização","3D"],
    dims:{x:200,y:80,z:15}, volume:24.0, estimatedTime:2.8,
    slice:{layer:0.2,infill:30,support:false,walls:3},
    materialType:"PLA", printCount:11, sellPrice:60.00, featured:false, thumbH:190, accent:"#f43f5e", svgKey:"letter",
  },
];

/* ══ Orders data ════════════════════════════════════════════════ */

const STATUS_CFG: Record<OrderStatus, { label:string; accent:string; bg:string; next?: OrderStatus }> = {
  orcamento:  { label:"Orçamento",  accent:"#6b7280", bg:"rgba(107,114,128,0.12)", next:"confirmado"  },
  confirmado: { label:"Confirmado", accent:"#3b82f6", bg:"rgba(59,130,246,0.12)",  next:"na_fila"    },
  na_fila:    { label:"Na Fila",    accent:"#a78bfa", bg:"rgba(167,139,250,0.12)", next:"imprimindo"  },
  imprimindo: { label:"Imprimindo", accent:"#06b6d4", bg:"rgba(6,182,212,0.12)",   next:"pronto"     },
  pronto:     { label:"Pronto",     accent:"#f59e0b", bg:"rgba(245,158,11,0.12)",  next:"entregue"   },
  entregue:   { label:"Entregue",   accent:"#10b981", bg:"rgba(16,185,129,0.12)"                     },
  cancelado:  { label:"Cancelado",  accent:"#ef4444", bg:"rgba(239,68,68,0.12)"                      },
};
const PAY_LABEL: Record<PayMethod, string> = { pix:"Pix", cartao:"Cartão de crédito", boleto:"Boleto", dinheiro:"Dinheiro" };
const ORDER_STATUSES: OrderStatus[] = ["orcamento","confirmado","na_fila","imprimindo","pronto","entregue","cancelado"];
const D = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const INIT_ORDERS: Order[] = [
  {
    id:"o1", num:"#050", client:"RoboLab UFMG", initials:"RU", avatarColor:"#3b82f6",
    items:[
      { id:"i1", model:"Garra robótica",  qty:1, material:"PLA+", color:"Preto", colorHex:"#1A1A2E", unitPrice:540 },
      { id:"i2", model:"Suporte sensor",  qty:4, material:"PLA",  color:"Cinza", colorHex:"#6B7280", unitPrice:25  },
    ],
    deadline:D(2026,8,16), status:"imprimindo", payment:"pix",
    total:640, deposit:320, progress:67, notes:"Tolerâncias de ±0.1mm obrigatórias nos furos.",
    createdAt:D(2026,8,10),
  },
  {
    id:"o2", num:"#051", client:"FabLab Curitiba", initials:"FC", avatarColor:"#10b981",
    items:[{ id:"i1", model:"Peça reposição CNC", qty:2, material:"PLA+", color:"Cinza", colorHex:"#6B7280", unitPrice:190 }],
    deadline:D(2026,8,14), status:"pronto", payment:"cartao",
    total:380, deposit:380, notes:"Pronto há 1 dia — cliente avisado por WhatsApp.",
    createdAt:D(2026,8,7),
  },
  {
    id:"o3", num:"#047", client:"MakerShop SP", initials:"MS", avatarColor:"#a78bfa",
    items:[{ id:"i1", model:"Suporte ergonômico", qty:3, material:"PLA", color:"Branco", colorHex:"#F0EDE8", unitPrice:95 }],
    deadline:D(2026,8,20), status:"na_fila", payment:"pix",
    total:285, deposit:142, notes:"Embalagem individual em bubble wrap.",
    createdAt:D(2026,8,12),
  },
  {
    id:"o4", num:"#048", client:"Eletrotec Ltda", initials:"EL", avatarColor:"#f59e0b",
    items:[{ id:"i1", model:"Tampa caixa elétrica", qty:6, material:"PETG", color:"Cinza", colorHex:"#9CA3AF", unitPrice:70 }],
    deadline:D(2026,8,18), status:"confirmado", payment:"boleto",
    total:420, deposit:0, notes:"Cor cinza neutro RAL 7035 — aguardando filamento PETG.",
    createdAt:D(2026,8,13),
  },
  {
    id:"o5", num:"#053", client:"Geek Store BH", initials:"GS", avatarColor:"#f43f5e",
    items:[
      { id:"i1", model:"Peão Oversize (decorativo)", qty:8, material:"PLA",  color:"Branco", colorHex:"#F0EDE8", unitPrice:75  },
      { id:"i2", model:"Rei Oversize (decorativo)",  qty:2, material:"PLA",  color:"Preto",  colorHex:"#1A1A2E", unitPrice:120 },
    ],
    deadline:D(2026,8,28), status:"na_fila", payment:"cartao",
    total:1200, deposit:600, notes:"Emissão de NF necessária. CNPJ: 12.345.678/0001-90.",
    createdAt:D(2026,8,14),
  },
  {
    id:"o6", num:"#049", client:"Studio Pixel", initials:"SP", avatarColor:"#06b6d4",
    items:[{ id:"i1", model:"Monograma 3D \"FAB\"", qty:1, material:"PLA", color:"Azul Marinho", colorHex:"#1E3A5F", unitPrice:150 }],
    deadline:D(2026,8,25), status:"orcamento", payment:"pix",
    total:150, deposit:0,
    createdAt:D(2026,8,15),
  },
  {
    id:"o7", num:"#055", client:"Eletrotec Ltda", initials:"EL", avatarColor:"#f59e0b",
    items:[
      { id:"i1", model:"Caixa junction IP65", qty:3, material:"PETG", color:"Cinza", colorHex:"#9CA3AF", unitPrice:110 },
      { id:"i2", model:"Suporte calha DIN",   qty:5, material:"PLA",  color:"Preto", colorHex:"#1A1A2E", unitPrice:48  },
    ],
    deadline:D(2026,9,12), status:"orcamento", payment:"boleto",
    total:690, deposit:0,
    createdAt:D(2026,8,15),
  },
  {
    id:"o8", num:"#054", client:"MakerShop SP", initials:"MS", avatarColor:"#a78bfa",
    items:[{ id:"i1", model:"Protetor de Quina TPU", qty:20, material:"TPU", color:"Natural Flex", colorHex:"#E8E0C8", unitPrice:22 }],
    deadline:D(2026,9,5), status:"confirmado", payment:"pix",
    total:440, deposit:220,
    createdAt:D(2026,8,14),
  },
  {
    id:"o9", num:"#042", client:"Studio Noir", initials:"SN", avatarColor:"#8b5cf6",
    items:[{ id:"i1", model:"Suporte GoPro HERO", qty:1, material:"PETG", color:"Preto", colorHex:"#1A1A2E", unitPrice:95 }],
    deadline:D(2026,8,13), status:"pronto", payment:"pix",
    total:95, deposit:95, notes:"Pronto há 2 dias — tentando contato.",
    createdAt:D(2026,8,8),
  },
  {
    id:"o10", num:"#052", client:"Nexus Tech", initials:"NT", avatarColor:"#0ea5e9",
    items:[{ id:"i1", model:"Case customizado Nexus", qty:5, material:"PLA", color:"Azul Marinho", colorHex:"#1E3A5F", unitPrice:178 }],
    deadline:D(2026,8,10), status:"entregue", payment:"cartao",
    total:890, deposit:890,
    createdAt:D(2026,7,28),
  },
  {
    id:"o11", num:"#044", client:"FabLab Curitiba", initials:"FC", avatarColor:"#10b981",
    items:[{ id:"i1", model:"Engrenagem Helicoidal", qty:2, material:"PLA+", color:"Preto", colorHex:"#1A1A2E", unitPrice:95 }],
    deadline:D(2026,8,8), status:"entregue", payment:"pix",
    total:190, deposit:190,
    createdAt:D(2026,7,30),
  },
  {
    id:"o12", num:"#039", client:"Loja Virtual SP", initials:"LV", avatarColor:"#6b7280",
    items:[{ id:"i1", model:"Placa de sinalização", qty:4, material:"PLA", color:"Branco", colorHex:"#F0EDE8", unitPrice:55 }],
    deadline:D(2026,8,12), status:"cancelado", payment:"pix",
    total:220, deposit:0, notes:"Cliente cancelou — material liberado.",
    createdAt:D(2026,8,5),
  },
];

/* ══ Calculator constants ════════════════════════════════════════ */

const DENSITY: Record<string, number> = { PLA:1.24, "PLA+":1.20, PETG:1.27, ABS:1.04, ASA:1.07, TPU:1.21 };
const CPK: Record<string, number>     = { PLA:89, "PLA+":85, PETG:128, ABS:75, ASA:120, TPU:160 };
const LAYER_T: Record<string, number> = { "0.1":2.05, "0.2":1.0, "0.3":0.62 };
const DEFAULT_CPH = 3.80;

/* ══ Shared helpers ══════════════════════════════════════════════ */

const fc  = (p: number) => p < 0.2 ? "#ef4444" : p < 0.4 ? "#f59e0b" : "#10b981";
const hcl = (h: number) => h >= 80 ? "#10b981" : h >= 50 ? "#f59e0b" : "#ef4444";

const MTYPE: Record<MType, { label: string; Icon: any; color: string }> = {
  preventiva: { label:"Preventiva", Icon:Shield,    color:"#3b82f6" },
  corretiva:  { label:"Corretiva",  Icon:Wrench,    color:"#ef4444" },
  troca:      { label:"Troca",      Icon:RefreshCw, color:"#f59e0b" },
  calibracao: { label:"Calibração", Icon:Sliders,   color:"#a78bfa" },
};
const PSTATUS: Record<PStatus, { label: string; accent: string; bg: string }> = {
  ativa:      { label:"Ativa",      accent:"#10b981", bg:"rgba(16,185,129,0.12)" },
  manutencao: { label:"Manutenção", accent:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
  inativa:    { label:"Inativa",    accent:"#ef4444", bg:"rgba(239,68,68,0.12)"  },
};
const NAV_ITEMS = [
  { label:"Dashboard",   Icon:Home       },
  { label:"Impressoras", Icon:Printer    },
  { label:"Materiais",   Icon:Package    },
  { label:"Catálogo",    Icon:Layers     },
  { label:"Calculadora", Icon:Calculator },
  { label:"Pedidos",     Icon:Box        },
  { label:"Clientes",    Icon:Users      },
  { label:"Financeiro",  Icon:DollarSign },
  { label:"Relatórios",  Icon:BarChart2  },
];

/* ══ Spool SVG ═══════════════════════════════════════════════════ */

function SpoolSvg({ hex, pct, size = 80 }: { hex: string; pct: number; size?: number }) {
  const cx = 40, cy = 40, R = 33, r = 11;
  const emptyR = r + (R - r) * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx={cx} cy={cy + 1.5} r={R + 4} fill="#000" fillOpacity="0.28" />
      <circle cx={cx} cy={cy} r={R + 4} fill="#191c28" stroke="#2d3147" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={R} fill={hex} />
      <circle cx={cx} cy={cy} r={R} fill="white" fillOpacity="0.04" />
      <circle cx={cx} cy={cy} r={emptyR} fill="#191c28" />
      <circle cx={cx} cy={cy} r={r + 4} fill="#191c28" stroke="#2d3147" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="#0d0f15" />
      {[0,60,120,180,240,300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return <line key={deg}
          x1={cx + Math.cos(rad) * (r - 1)} y1={cy + Math.sin(rad) * (r - 1)}
          x2={cx + Math.cos(rad) * (r + 5)} y2={cy + Math.sin(rad) * (r + 5)}
          stroke="#2d3147" strokeWidth="1.5" strokeLinecap="round"
        />;
      })}
      <circle cx={cx} cy={cy} r={3} fill="#2d3147" />
    </svg>
  );
}

/* ══ Model Thumbnail SVG ═════════════════════════════════════════ */

function ModelThumbnail({ svgKey, accent, h }: { svgKey: string; accent: string; h: number }) {
  const W = "white";
  const shapes: Record<string, JSX.Element> = {
    gear: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <circle cx="100" cy="82" r="62" fill={accent} fillOpacity="0.1"/>
        {[0,45,90,135,180,225,270,315].map(d => (
          <rect key={d} x="93" y="22" width="14" height="22" rx="3"
            fill={W} fillOpacity="0.78"
            transform={`rotate(${d},100,82)`}
          />
        ))}
        <circle cx="100" cy="82" r="38" fill={W} fillOpacity="0.07" stroke={W} strokeOpacity="0.55" strokeWidth="2"/>
        <circle cx="100" cy="82" r="18" fill={W} fillOpacity="0.06" stroke={W} strokeOpacity="0.35" strokeWidth="1.5"/>
        <circle cx="100" cy="82" r="7" fill={W} fillOpacity="0.55"/>
        {[0,60,120,180,240,300].map(d => {
          const r2 = (d*Math.PI)/180;
          return <line key={d} x1={100+Math.cos(r2)*7} y1={82+Math.sin(r2)*7} x2={100+Math.cos(r2)*16} y2={82+Math.sin(r2)*16} stroke={W} strokeOpacity="0.25" strokeWidth="1.5"/>;
        })}
      </svg>
    ),
    vase: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <path d="M82 148 C74 125 65 98 70 72 C74 52 86 35 100 28 C114 35 126 52 130 72 C135 98 126 125 118 148 Z"
          fill={W} fillOpacity="0.82"/>
        <path d="M82 148 L118 148 L122 155 L78 155 Z" fill={W} fillOpacity="0.5"/>
        <ellipse cx="100" cy="31" rx="11" ry="5" fill={W} fillOpacity="0.4"/>
        <path d="M80 110 C79 104 79 96 80 88" stroke={W} strokeOpacity="0.25" strokeWidth="1.5" fill="none"/>
        <path d="M72 76 C69 72 68 66 70 62" stroke={W} strokeOpacity="0.2" strokeWidth="1.5" fill="none"/>
        <ellipse cx="100" cy="148" rx="18" ry="4" fill={W} fillOpacity="0.15"/>
      </svg>
    ),
    bracket: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <rect x="58" y="103" width="106" height="24" rx="4" fill={W} fillOpacity="0.8"/>
        <rect x="58" y="35" width="24" height="93" rx="4" fill={W} fillOpacity="0.75"/>
        <polygon points="82,103 82,78 107,103" fill={W} fillOpacity="0.35"/>
        {[{cx:100,cy:115},{cx:126,cy:115},{cx:150,cy:115}].map(({cx,cy},i)=>(
          <circle key={i} cx={cx} cy={cy} r="5.5" fill="none" stroke={W} strokeOpacity="0.55" strokeWidth="1.5"/>
        ))}
        <circle cx="70" cy="56" r="5.5" fill="none" stroke={W} strokeOpacity="0.55" strokeWidth="1.5"/>
        <circle cx="70" cy="80" r="5.5" fill="none" stroke={W} strokeOpacity="0.55" strokeWidth="1.5"/>
        <line x1="58" y1="103" x2="164" y2="103" stroke={W} strokeOpacity="0.2" strokeWidth="1"/>
      </svg>
    ),
    box: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <polygon points="100,26 154,54 100,82 46,54" fill={W} fillOpacity="0.88"/>
        <polygon points="154,54 154,122 100,150 100,82" fill={W} fillOpacity="0.5"/>
        <polygon points="46,54 100,82 100,150 46,122" fill={W} fillOpacity="0.3"/>
        <polyline points="100,26 154,54 154,122 100,150 46,122 46,54 100,26"
          fill="none" stroke={W} strokeOpacity="0.35" strokeWidth="1.2"/>
        <line x1="100" y1="82" x2="100" y2="150" stroke={W} strokeOpacity="0.25" strokeWidth="1"/>
        <line x1="100" y1="82" x2="154" y2="54" stroke={W} strokeOpacity="0.2" strokeWidth="1"/>
        <line x1="100" y1="82" x2="46" y2="54" stroke={W} strokeOpacity="0.2" strokeWidth="1"/>
      </svg>
    ),
    arch: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <rect x="50" y="90" width="100" height="62" rx="2" fill={W} fillOpacity="0.72"/>
        <polygon points="100,20 158,90 42,90" fill={W} fillOpacity="0.88"/>
        <rect x="89" y="120" width="22" height="32" rx="5" fill={W} fillOpacity="0.2"/>
        <rect x="60" y="100" width="20" height="20" rx="2" fill={W} fillOpacity="0.2"/>
        <rect x="120" y="100" width="20" height="20" rx="2" fill={W} fillOpacity="0.2"/>
        <line x1="100" y1="20" x2="100" y2="90" stroke={W} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 3"/>
      </svg>
    ),
    pawn: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <path d="M72 152 L128 152 L122 130 L117 118 C109 115 107 110 107 105 L107 93 C118 88 124 79 124 68 C124 54 113 43 100 43 C87 43 76 54 76 68 C76 79 82 88 93 93 L93 105 C93 110 91 115 83 118 L78 130 Z"
          fill={W} fillOpacity="0.82"/>
        <circle cx="100" cy="30" r="15" fill={W} fillOpacity="0.88"/>
        <ellipse cx="100" cy="152" rx="28" ry="5" fill={W} fillOpacity="0.2"/>
      </svg>
    ),
    mount: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <rect x="46" y="62" width="108" height="16" rx="6" fill={W} fillOpacity="0.8"/>
        <rect x="90" y="78" width="20" height="64" rx="6" fill={W} fillOpacity="0.7"/>
        <rect x="68" y="130" width="64" height="18" rx="4" fill={W} fillOpacity="0.6"/>
        <rect x="44" y="45" width="36" height="28" rx="4" fill={W} fillOpacity="0.6"/>
        <circle cx="57" cy="59" r="4.5" fill="none" stroke={W} strokeOpacity="0.5" strokeWidth="1.5"/>
        {[82,118].map(x=><circle key={x} cx={x} cy="139" r="4" fill="none" stroke={W} strokeOpacity="0.45" strokeWidth="1.5"/>)}
        <line x1="80" y1="62" x2="80" y2="78" stroke={W} strokeOpacity="0.25" strokeWidth="1"/>
      </svg>
    ),
    hook: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <rect x="84" y="22" width="20" height="80" rx="5" fill={W} fillOpacity="0.6"/>
        <path d="M 94 98 C 94 130 62 145 56 122 C 50 100 72 86 88 98"
          stroke={W} strokeOpacity="0.85" strokeWidth="14" strokeLinecap="round" fill="none"/>
        <circle cx="94" cy="36" r="5" fill={W} fillOpacity="0.5"/>
        <circle cx="94" cy="58" r="5" fill={W} fillOpacity="0.5"/>
        <rect x="80" y="18" width="28" height="8" rx="3" fill={W} fillOpacity="0.45"/>
      </svg>
    ),
    hex: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <polygon points="100,18 152,48 152,108 100,138 48,108 48,48"
          fill={W} fillOpacity="0.08" stroke={W} strokeOpacity="0.82" strokeWidth="7"/>
        <polygon points="100,42 132,60 132,96 100,114 68,96 68,60"
          fill={W} fillOpacity="0.05" stroke={W} strokeOpacity="0.35" strokeWidth="1.5"/>
        {[[100,18,100,42],[152,48,132,60],[152,108,132,96],[100,138,100,114],[48,108,68,96],[48,48,68,60]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={W} strokeOpacity="0.35" strokeWidth="1.5"/>
        ))}
      </svg>
    ),
    corner: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <polygon points="50,68 100,48 100,92 50,112" fill={W} fillOpacity="0.82"/>
        <polygon points="50,112 100,92 100,142 50,142" fill={W} fillOpacity="0.52"/>
        <polygon points="100,48 150,68 150,142 100,142 100,92" fill={W} fillOpacity="0.32"/>
        <line x1="100" y1="48" x2="100" y2="142" stroke={W} strokeOpacity="0.5" strokeWidth="1.5"/>
        <line x1="50" y1="68" x2="150" y2="68" stroke={W} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3"/>
      </svg>
    ),
    phonestand: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <polygon points="50,142 152,142 152,50" fill={W} fillOpacity="0.82"/>
        <rect x="140" y="58" width="9" height="62" rx="2" fill={W} fillOpacity="0.22"/>
        <line x1="45" y1="146" x2="157" y2="146" stroke={W} strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round"/>
        {[65,90,115,140].map(x=><circle key={x} cx={x} cy="146" r="4" fill={W} fillOpacity="0.5"/>)}
        <line x1="50" y1="142" x2="152" y2="142" stroke={W} strokeOpacity="0.2" strokeWidth="1"/>
      </svg>
    ),
    letter: (
      <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
        <rect x="58" y="22" width="24" height="116" rx="3" fill={W} fillOpacity="0.85"/>
        <rect x="58" y="22" width="80" height="24" rx="3" fill={W} fillOpacity="0.85"/>
        <rect x="58" y="68" width="64" height="22" rx="3" fill={W} fillOpacity="0.85"/>
        <rect x="64" y="28" width="80" height="24" rx="3" fill={W} fillOpacity="0.12" transform="translate(4,6)"/>
        <rect x="64" y="74" width="64" height="22" rx="3" fill={W} fillOpacity="0.08" transform="translate(4,6)"/>
      </svg>
    ),
  };
  return (
    <div className="overflow-hidden flex-shrink-0 relative" style={{ height:h, background:`linear-gradient(145deg, ${accent}28 0%, ${accent}08 60%, #090b10 100%)` }}>
      {shapes[svgKey] ?? shapes.gear}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
    </div>
  );
}

/* ══ Model Card ══════════════════════════════════════════════════ */

function ModelCard({ m, onClick }: { m: PrintModel; onClick: () => void }) {
  const catColor = CAT_COLOR[m.category];
  const topPrinter = m.printCount >= 40;
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card group cursor-pointer hover:border-white/[0.18] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
      style={{ breakInside:"avoid", marginBottom:"16px" }}
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <ModelThumbnail svgKey={m.svgKey} accent={m.accent} h={m.thumbH} />
        {/* Badges */}
        {topPrinter && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold font-mono uppercase" style={{ background:"rgba(16,185,129,0.9)", color:"white", backdropFilter:"blur(4px)" }}>
            <TrendingUp className="w-3 h-3" /> Mais impresso
          </div>
        )}
        {m.featured && !topPrinter && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded text-[9px] font-bold font-mono uppercase" style={{ background:"rgba(59,130,246,0.9)", color:"white", backdropFilter:"blur(4px)" }}>
            Destaque
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-3 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-[10px] font-mono text-white/70">{m.dims.x}×{m.dims.y}×{m.dims.z} mm</div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/70"><Clock className="w-3 h-3" />{m.estimatedTime}h</div>
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-[13px] font-semibold text-foreground leading-snug">{m.name}</div>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase" style={{ background:`${catColor}18`, color:catColor }}>
              <Tag className="w-2.5 h-2.5" />{m.category}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[13px] font-semibold" style={{ color:catColor }}>R$ {m.sellPrice.toFixed(0)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">preço sugerido</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border">
          <div><div className="text-[11px] font-mono font-semibold text-foreground">{m.volume}cm³</div><div className="text-[9px] text-muted-foreground font-mono">volume</div></div>
          <div><div className="text-[11px] font-mono font-semibold text-foreground">{m.estimatedTime}h</div><div className="text-[9px] text-muted-foreground font-mono">tempo est.</div></div>
          <div><div className="text-[11px] font-mono font-semibold text-foreground">{m.printCount}×</div><div className="text-[9px] text-muted-foreground font-mono">impresso</div></div>
        </div>
      </div>
    </div>
  );
}

/* ══ Model Drawer (with live cost calculator) ════════════════════ */

function ModelDrawer({ m, onClose }: { m: PrintModel | null; onClose: () => void }) {
  const [cMat,     setCMat]     = useState(m?.materialType ?? "PLA");
  const [cInfill,  setCInfill]  = useState(m?.slice.infill ?? 20);
  const [cLayer,   setCLayer]   = useState<0.1|0.2|0.3>(m?.slice.layer ?? 0.2);
  const [cSupport, setCSupport] = useState(m?.slice.support ?? false);
  const [cWalls,   setCWalls]   = useState(m?.slice.walls ?? 3);

  if (!m) return null;
  const catColor = CAT_COLOR[m.category];

  // Live cost calculation
  const shellFrac     = Math.min(0.55, 0.12 + cWalls * 0.028);
  const infillFrac    = (1 - shellFrac) * (cInfill / 100);
  const volUsed       = m.volume * (shellFrac + infillFrac) * (cSupport ? 1.13 : 1);
  const density       = DENSITY[cMat] ?? 1.24;
  const costPerKg     = CPK[cMat] ?? 89;
  const gramsUsed     = volUsed * density;
  const matCost       = gramsUsed * (costPerKg / 1000);
  const timeMult      = LAYER_T[cLayer.toString()] ?? 1.0;
  const machineH      = m.estimatedTime * timeMult;
  const machineCost   = machineH * DEFAULT_CPH;
  const totalCost     = matCost + machineCost;
  const margin        = m.sellPrice > 0 ? ((m.sellPrice - totalCost) / m.sellPrice) * 100 : 0;
  const marginColor   = margin >= 60 ? "#10b981" : margin >= 30 ? "#f59e0b" : "#ef4444";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[480px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        {/* Thumbnail header */}
        <div className="relative flex-shrink-0">
          <ModelThumbnail svgKey={m.svgKey} accent={m.accent} h={180} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          {m.printCount >= 40 && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold font-mono uppercase" style={{ background:"rgba(16,185,129,0.9)", color:"white" }}>
              <TrendingUp className="w-3 h-3" /> Mais impresso
            </div>
          )}
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"none" }}>
          {/* Name + category */}
          <div className="p-5 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">{m.name}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase" style={{ background:`${catColor}18`, color:catColor }}>
                    <Tag className="w-2.5 h-2.5" />{m.category}
                  </span>
                  {m.tags.map(t => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display font-bold" style={{ fontSize:"22px", color:catColor }}>R$ {m.sellPrice.toFixed(0)}</div>
                <div className="text-[10px] font-mono text-muted-foreground">preço sugerido</div>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{m.desc}</p>
          </div>
          {/* Specs grid */}
          <div className="p-5 pb-4 border-b border-border">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Especificações do modelo</div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val:`${m.dims.x} × ${m.dims.y} × ${m.dims.z} mm`, lbl:"Dimensões (X·Y·Z)" },
                { val:`${m.volume} cm³`,                              lbl:"Volume de material" },
                { val:`${m.estimatedTime}h (camada 0.2)`,            lbl:"Tempo base est."    },
                { val:`${m.printCount} vezes`,                        lbl:"Total impresso"     },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="bg-background rounded-lg p-3 border border-border">
                  <div className="font-display font-bold text-foreground" style={{ fontSize:"14px" }}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          {/* ── LIVE COST CALCULATOR ── */}
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-primary" />
              <span className="text-[13px] font-semibold text-foreground">Calculadora de custo ao vivo</span>
            </div>
            {/* Material selector */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2">Material</div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.keys(CPK).map(mat => (
                  <button key={mat} onClick={() => setCMat(mat)}
                    className="px-2 py-2 rounded-lg border text-[11px] font-mono text-center transition-all"
                    style={cMat===mat ? { borderColor:"#3b82f6", background:"rgba(59,130,246,0.12)", color:"#3b82f6" } : { borderColor:"rgba(255,255,255,0.07)", color:"#6b7280" }}
                  >
                    <div className="font-semibold">{mat}</div>
                    <div className="text-[9px] mt-0.5 opacity-70">R$ {CPK[mat]}/kg</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Infill slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Preenchimento (infill)</div>
                <div className="text-[12px] font-mono font-semibold text-foreground">{cInfill}%</div>
              </div>
              <input type="range" min={5} max={100} step={5} value={cInfill} onChange={e=>setCInfill(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background:`linear-gradient(to right, #3b82f6 ${cInfill}%, rgba(255,255,255,0.1) ${cInfill}%)` }}
              />
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground/40 mt-1">
                <span>5% (rápido)</span><span>50% (padrão)</span><span>100% (sólido)</span>
              </div>
            </div>
            {/* Layer height */}
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2">Altura de camada</div>
              <div className="flex gap-2">
                {([0.1,0.2,0.3] as const).map(l => (
                  <button key={l} onClick={() => setCLayer(l)}
                    className="flex-1 py-2 rounded-lg border text-[11px] font-mono transition-all"
                    style={cLayer===l ? { borderColor:"#3b82f6", background:"rgba(59,130,246,0.12)", color:"#3b82f6" } : { borderColor:"rgba(255,255,255,0.07)", color:"#6b7280" }}
                  >
                    <div className="font-semibold">{l}mm</div>
                    <div className="text-[9px] opacity-60">{l===0.1?"detalhe":l===0.2?"padrão":"rápido"}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Walls + Support in a row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Wall count stepper */}
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2">Paredes</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCWalls(w => Math.max(2, w-1))} className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/70 flex items-center justify-center text-foreground transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 text-center text-[14px] font-display font-bold text-foreground">{cWalls}</div>
                  <button onClick={() => setCWalls(w => Math.min(8, w+1))} className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/70 flex items-center justify-center text-foreground transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Support toggle */}
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2">Suporte</div>
                <button onClick={() => setCSupport(s => !s)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border w-full transition-all"
                  style={cSupport ? { borderColor:"#f59e0b", background:"rgba(245,158,11,0.1)" } : { borderColor:"rgba(255,255,255,0.07)" }}
                >
                  <div className="w-8 h-4.5 rounded-full relative flex-shrink-0" style={{ background:cSupport?"#f59e0b":"rgba(255,255,255,0.1)" }}>
                    <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all" style={{ left:cSupport?"calc(100% - 14px - 2px)":"2px" }} />
                  </div>
                  <span className="text-[11px] font-mono" style={{ color:cSupport?"#f59e0b":"#6b7280" }}>{cSupport?"Ativado":"Desativado"}</span>
                </button>
              </div>
            </div>
            {/* LIVE RESULTS */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-[10px] font-mono text-primary uppercase tracking-[0.1em] mb-3">Resultado da simulação</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { val:`${gramsUsed.toFixed(1)}g`,      lbl:"Material usado",    color:"#d4d8e8"   },
                  { val:`${machineH.toFixed(1)}h`,        lbl:"Tempo estimado",    color:"#d4d8e8"   },
                  { val:`R$ ${matCost.toFixed(2)}`,       lbl:"Custo material",    color:"#d4d8e8"   },
                  { val:`R$ ${machineCost.toFixed(2)}`,   lbl:"Custo máquina",     color:"#d4d8e8"   },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl} className="bg-background/60 rounded-lg p-2.5">
                    <div className="font-mono font-semibold" style={{ fontSize:"13px", color }}>{val}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
                  </div>
                ))}
              </div>
              {/* Total + Margin highlight */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 bg-background/60 rounded-lg p-2.5">
                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">Custo total</div>
                  <div className="font-display font-bold text-foreground" style={{ fontSize:"20px" }}>R$ {totalCost.toFixed(2)}</div>
                </div>
                <div className="flex-1 bg-background/60 rounded-lg p-2.5" style={{ border:`1px solid ${marginColor}30` }}>
                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">Margem bruta</div>
                  <div className="font-display font-bold" style={{ fontSize:"20px", color:marginColor }}>{margin.toFixed(1)}%</div>
                </div>
              </div>
              {margin < 30 && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Margem baixa — considere revisar o preço de venda
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Footer actions */}
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Criar pedido com este modelo
          </button>
          <button className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">Editar</button>
        </div>
      </div>
    </div>
  );
}

/* ══ Spool Card ══════════════════════════════════════════════════ */

function SpoolCard({ f, onClick }: { f: Filament; onClick: () => void }) {
  const pct = f.current / f.initial;
  const sc  = fc(pct);
  const sl  = pct < 0.2 ? "CRÍTICO" : pct < 0.4 ? "BAIXO" : null;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center rounded-xl border border-border bg-card p-3.5 hover:border-white/[0.17] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 group"
      style={{ width:"136px" }}
    >
      <div className="relative mb-2.5">
        <SpoolSvg hex={f.colorHex} pct={pct} size={80} />
        {sl && (
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase text-white" style={{ background:sc }}>
            {sl}
          </div>
        )}
      </div>
      <div className="text-center w-full">
        <div className="text-[9px] font-mono font-bold uppercase tracking-[0.06em] text-muted-foreground mb-0.5">{f.material}</div>
        <div className="text-[11px] font-semibold text-foreground truncate leading-tight">{f.color}</div>
        <div className="text-[10px] text-muted-foreground font-mono truncate">{f.brand}</div>
        <div className="mt-2.5">
          <div className="flex justify-between text-[9px] font-mono mb-1" style={{ color:sc }}>
            <span>{f.current}g</span><span>{Math.round(pct * 100)}%</span>
          </div>
          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${pct*100}%`, background:sc }} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ══ Filament Drawer ═════════════════════════════════════════════ */

function FilamentDrawer({ f, onClose, onUsage }: { f: Filament | null; onClose: () => void; onUsage: () => void }) {
  if (!f) return null;
  const pct = f.current / f.initial;
  const sc  = fc(pct);
  const sl  = pct < 0.2 ? "CRÍTICO" : pct < 0.4 ? "BAIXO" : "OK";
  const cpg = (f.costPerKg / 1000).toFixed(3);
  const stockVal = (f.current * f.costPerKg / 1000).toFixed(2);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[440px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        <div className="p-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <SpoolSvg hex={f.colorHex} pct={pct} size={72} />
              <div>
                <div className="text-[15px] font-semibold text-foreground">{f.color}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{f.material} · {f.brand}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Ø {f.diameter}mm · Aberto em {f.openedAt}</div>
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase" style={{ background:`${sc}18`, color:sc }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background:sc }} />{sl}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="relative group">
            <div className="flex justify-between text-[11px] font-mono mb-1.5">
              <span className="text-muted-foreground">Peso disponível</span>
              <span style={{ color:sc }}>{f.current}g de {f.initial}g ({Math.round(pct*100)}%)</span>
            </div>
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${pct*100}%`, background:sc }} />
            </div>
            <div className="pointer-events-none absolute left-0 top-full mt-2 z-20 opacity-0 translate-y-[-4px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-2xl shadow-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[10px] font-mono text-foreground whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                  <span>Abaixo de 40% = estoque baixo</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-foreground whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <span>Abaixo de 10% = estoque crítico</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth:"none" }}>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Custo</div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val:`R$ ${f.costPerKg.toFixed(2)}`, lbl:"Por quilograma"   },
                { val:`R$ ${cpg}`,                    lbl:"Por grama"        },
                { val:`R$ ${stockVal}`,               lbl:"Valor em estoque" },
                { val:`${f.initial}g`,                lbl:"Carretel cheio"   },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="bg-background rounded-lg p-3 border border-border">
                  <div className="font-display font-bold text-foreground" style={{ fontSize:"16px" }}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Impressoras compatíveis</div>
            <div className="flex flex-wrap gap-1.5">
              {f.printers.map(p => (
                <span key={p} className="text-[11px] font-mono px-2.5 py-1 rounded bg-muted/40 text-foreground border border-border">{p}</span>
              ))}
            </div>
          </div>
          {f.buyLink && (
            <div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Link de compra</div>
              <a href={f.buyLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[13px] text-foreground group-hover:text-primary transition-colors">Abrir link de compra</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </a>
            </div>
          )}
          {f.usage.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Histórico de uso</div>
              <div className="space-y-2">
                {f.usage.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background border border-border">
                    <div>
                      <div className="text-[12px] text-foreground font-medium">{u.job ?? "Uso manual"}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{u.date}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] font-mono text-destructive">
                      <Minus className="w-3 h-3" />{u.grams}g
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button onClick={onUsage} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            <Minus className="w-3.5 h-3.5" /> Registrar uso
          </button>
          <button className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">Editar</button>
        </div>
      </div>
    </div>
  );
}

/* ══ Box Card ════════════════════════════════════════════════════ */

function BoxCard({ b, onClick }: { b: CaixaItem; onClick: () => void }) {
  const pct = b.current / b.initial;
  const sc  = fc(pct);
  const sl  = pct < 0.2 ? "CRÍTICO" : pct < 0.4 ? "BAIXO" : null;
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-border bg-card p-3.5 text-left hover:border-white/[0.17] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 group"
      style={{ width:"160px" }}
    >
      <div className="relative mb-2.5 flex items-center justify-center w-full">
        <div className="w-16 h-16 rounded-xl border border-border flex items-center justify-center bg-muted/20">
          <Package className="w-7 h-7 text-muted-foreground/60" />
        </div>
        {sl && (
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase text-white" style={{ background:sc }}>
            {sl}
          </div>
        )}
      </div>
      <div className="w-full">
        <div className="text-[11px] font-semibold text-foreground leading-tight truncate">{b.name}</div>
        <div className="mt-2.5">
          <div className="flex justify-between text-[9px] font-mono mb-1" style={{ color:sc }}>
            <span>{b.current} un.</span><span>{Math.round(pct * 100)}%</span>
          </div>
          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${pct*100}%`, background:sc }} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ══ Box Drawer ══════════════════════════════════════════════════ */

function BoxDrawer({ b, onClose }: { b: CaixaItem | null; onClose: () => void }) {
  if (!b) return null;
  const pct = b.current / b.initial;
  const sc  = fc(pct);
  const sl  = pct < 0.2 ? "CRÍTICO" : pct < 0.4 ? "BAIXO" : "OK";
  const stockVal = (b.current * b.costPerUnit).toFixed(2);
  const boxFields = b.customFields && b.customFields.length > 0 ? b.customFields : getBoxCustomFields(b);

  const renderFieldValue = (field: CustomMaterialField) => {
    if (field.type === "cor" && field.value) return <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-border" style={{ background: field.value }} />{field.value}</span>;
    if (field.type === "opcoes") return field.value ?? "—";
    if (field.type === "numerico") return field.value ? `${Number(field.value).toLocaleString("pt-BR")}` : "—";
    if (field.type === "monetario") return field.value ? `R$ ${Number(field.value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
    if (field.type === "data") return field.value ?? "—";
    return field.value ?? "—";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[440px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        <div className="p-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-border flex items-center justify-center flex-shrink-0 bg-muted/20">
                <Package className="w-7 h-7 text-muted-foreground/60" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-foreground">{b.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Adicionado em {b.addedAt}</div>
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase" style={{ background:`${sc}18`, color:sc }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background:sc }} />{sl}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="relative group">
            <div className="flex justify-between text-[11px] font-mono mb-1.5">
              <span className="text-muted-foreground">Estoque disponível</span>
              <span style={{ color:sc }}>{b.current} de {b.initial} unidades ({Math.round(pct*100)}%)</span>
            </div>
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${pct*100}%`, background:sc }} />
            </div>
            <div className="pointer-events-none absolute left-0 top-full mt-2 z-20 opacity-0 translate-y-[-4px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-2xl shadow-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[10px] font-mono text-foreground whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                  <span>Abaixo de 40% = estoque baixo</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-foreground whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <span>Abaixo de 10% = estoque crítico</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth:"none" }}>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Custo</div>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { val:`R$ ${b.costPerUnit.toFixed(2)}`, lbl:"Por unidade"     },
                { val:`R$ ${stockVal}`,                  lbl:"Valor em estoque"},
                { val:`${b.current} un.`,                lbl:"Estoque atual"   },
                { val:`${b.initial} un.`,                lbl:"Estoque inicial" },
              ] as const).map(({ val, lbl }) => (
                <div key={lbl} className="bg-background rounded-lg p-3 border border-border">
                  <div className="font-display font-bold text-foreground" style={{ fontSize:"15px" }}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          {boxFields.length > 0 && (
            <div className="space-y-2.5">
              {boxFields.map(f => (
                <div key={f.id} className="rounded-xl border border-border bg-background p-3.5">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.08em] mb-1.5">{f.name}</div>
                  <div className="text-[14px] font-medium text-foreground">{renderFieldValue(f)}</div>
                </div>
              ))}
            </div>
          )}
          {b.buyLink && (
            <div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Link de compra</div>
              <a href={b.buyLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[13px] text-foreground group-hover:text-primary transition-colors">Abrir link de compra</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </a>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            <Minus className="w-3.5 h-3.5" /> Registrar saída
          </button>
          <button className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">Editar</button>
        </div>
      </div>
    </div>
  );
}

function BoxFilterDrawer({
  open,
  filters,
  onChange,
  onClose,
  onReset,
}: {
  open: boolean;
  filters: {
    type: "todos" | (typeof BOX_TYPE_OPTIONS)[number];
    stock: "todos" | "ok" | "baixo" | "critico";
    altura: { min: string; max: string };
    largura: { min: string; max: string };
    profundidade: { min: string; max: string };
  };
  onChange: (next: typeof filters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  if (!open) return null;

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors";
  const labelCls = "text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2 block";

  const updateRange = (key: "altura" | "largura" | "profundidade", target: "min" | "max", value: string) => {
    onChange({
      ...filters,
      [key]: {
        ...filters[key],
        [target]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[55] flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[420px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-foreground">Filtros das caixas</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">Refine o catálogo por tamanho e estoque</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth:"none" }}>
          <div>
            <label className={labelCls}>Tipo</label>
            <select
              value={filters.type}
              onChange={e => onChange({ ...filters, type: e.target.value as typeof filters.type })}
              className={inputCls}
            >
              <option value="todos">Todos</option>
              {BOX_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Nível de estoque</label>
            <select
              value={filters.stock}
              onChange={e => onChange({ ...filters, stock: e.target.value as typeof filters.stock })}
              className={inputCls}
            >
              <option value="todos">Todos</option>
              <option value="ok">OK</option>
              <option value="baixo">Baixo</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          {(["altura", "largura", "profundidade"] as const).map(key => (
            <div key={key}>
              <div className={labelCls}>{key === "altura" ? "Altura (mm)" : key === "largura" ? "Largura (mm)" : "Profundidade (mm)"}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-muted-foreground font-mono mb-1.5 block">De</label>
                  <input
                    type="number"
                    value={filters[key].min}
                    onChange={e => updateRange(key, "min", e.target.value)}
                    placeholder="X"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground font-mono mb-1.5 block">Até</label>
                  <input
                    type="number"
                    value={filters[key].max}
                    onChange={e => updateRange(key, "max", e.target.value)}
                    placeholder="Y"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button
            onClick={onReset}
            className="flex-1 px-3 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors"
          >
            Limpar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ Usage Modal ═════════════════════════════════════════════════ */

function UsageModal({ filaments, preselect, onClose, onConfirm }: {
  filaments: Filament[];
  preselect?: string;
  onClose: () => void;
  onConfirm: (id: string, grams: number, job: string) => void;
}) {
  const [selId, setSelId] = useState(preselect ?? filaments[0]?.id ?? "");
  const [grams, setGrams] = useState("");
  const [job,   setJob]   = useState("");
  const sel = filaments.find(f => f.id === selId);
  const g   = parseFloat(grams);
  const ok  = !!sel && !isNaN(g) && g > 0 && g <= sel.current;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-[440px] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-foreground">Registrar uso de filamento</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="mb-4">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2">Filamento</div>
          <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5" style={{ scrollbarWidth:"none" }}>
            {filaments.map(f => {
              const fp = f.current / f.initial;
              const fsc = fc(fp);
              return (
                <button key={f.id} onClick={() => setSelId(f.id)}
                  className="flex flex-col items-center p-2 rounded-lg border text-center transition-all"
                  style={selId === f.id ? { borderColor:"#3b82f6", background:"rgba(59,130,246,0.1)" } : { borderColor:"rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}
                >
                  <SpoolSvg hex={f.colorHex} pct={fp} size={40} />
                  <div className="text-[9px] font-mono font-semibold text-foreground mt-1 leading-tight">{f.material}</div>
                  <div className="text-[9px] font-mono text-muted-foreground truncate w-full">{f.color}</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color:fsc }}>{f.current}g</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">
              Quantidade usada (g){sel && <span className="normal-case text-muted-foreground/40 ml-1">— máx. {sel.current}g</span>}
            </label>
            <input type="number" value={grams} onChange={e => setGrams(e.target.value)} placeholder="ex: 85"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground font-mono focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block">Referência (opcional)</label>
            <input type="text" value={job} onChange={e => setJob(e.target.value)} placeholder="ex: Pedido #047"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground font-mono focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          {ok && (
            <div className="px-3 py-2.5 rounded-lg border font-mono text-[11px]" style={{ background:"rgba(59,130,246,0.08)", borderColor:"rgba(59,130,246,0.25)", color:"#93c5fd" }}>
              {sel!.current}g → <strong>{sel!.current - g}g</strong> restante após uso
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => ok && onConfirm(selId, g, job)} disabled={!ok}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-35"
            style={{ background:"#3b82f6", color:"white" }}
          >
            Confirmar uso
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-border rounded-lg text-[13px] text-foreground hover:bg-muted/40 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ══ Add Box Modal ═══════════════════════════════════════════════ */

function AddBoxModal({ onClose, onAdd }: { onClose: () => void; onAdd: (b: CaixaItem) => void }) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [qtdInicial, setQtdInicial] = useState("");
  const [qtdAtual, setQtdAtual] = useState("");
  const [custo, setCusto] = useState("");
  const [boxType, setBoxType] = useState<(typeof BOX_TYPE_OPTIONS)[number]>("Conrugado");
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [profundidade, setProfundidade] = useState("");
  const [buyLink, setBuyLink] = useState("");

  const canNext: Record<number, boolean> = {
    1: !!nome.trim(),
    2: !!qtdInicial && !!qtdAtual && !!custo,
    3: !!boxType && !!altura && !!largura && !!profundidade,
    4: true,
  };

  const handleFinish = () => {
    const resolvedType = boxType || (/kraft/i.test(nome) ? "Kraft" : /rígida|rigida/i.test(nome) ? "Rígida" : "Conrugado");
    const resolvedAltura = Number(altura) || 100;
    const resolvedLargura = Number(largura) || 100;
    const resolvedProfundidade = Number(profundidade) || 100;

    onAdd({
      id: `b${Date.now()}`,
      name: nome.trim(),
      initial: parseInt(qtdInicial),
      current: parseInt(qtdAtual),
      costPerUnit: parseFloat(custo),
      addedAt: new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }),
      buyLink: buyLink.trim() || undefined,
      customFields: [
        { id: `box-type-${Date.now()}`, name: "Tipo", type: "opcoes", value: resolvedType, options: [...BOX_TYPE_OPTIONS], required: true },
        { id: `box-altura-${Date.now()}`, name: "Altura (mm)", type: "numerico", value: String(resolvedAltura), required: true },
        { id: `box-largura-${Date.now()}`, name: "Largura (mm)", type: "numerico", value: String(resolvedLargura), required: true },
        { id: `box-profundidade-${Date.now()}`, name: "Profundidade (mm)", type: "numerico", value: String(resolvedProfundidade), required: true },
      ],
    });
    onClose();
  };

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors";
  const labelCls = "text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block";
  const STEPS = ["Identificação", "Estoque & custos", "Dados da caixa", "Link de compra"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[480px] max-h-[90vh] bg-card border border-border rounded-2xl flex flex-col shadow-2xl shadow-black/60" style={{ animation:"fadeIn 180ms ease" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-5 border-b border-border flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-foreground">Adicionar caixa</div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">Passo {step} de 4 — {STEPS[step-1]}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1.5 px-6 pt-5 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{ background: i < step ? "#3b82f6" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.1) transparent" }}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome / descrição</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Adicione um nome para o material" className={inputCls} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Qtd. inicial (unidades)</label>
                  <input type="number" value={qtdInicial} onChange={e => { setQtdInicial(e.target.value); if (!qtdAtual) setQtdAtual(e.target.value); }} placeholder="ex: 100" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Qtd. disponível atual</label>
                  <input type="number" value={qtdAtual} onChange={e => setQtdAtual(e.target.value)} placeholder="ex: 100" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Custo por unidade (R$)</label>
                <input type="number" value={custo} onChange={e => setCusto(e.target.value)} placeholder="ex: 1.80" className={inputCls} />
              </div>
              {custo && qtdInicial && (
                <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">Valor total do lote</span>
                  <span className="text-[14px] font-bold font-display text-primary">
                    R$ {(parseFloat(custo) * parseInt(qtdInicial || "0")).toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  </span>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOX_TYPE_OPTIONS.map(type => (
                    <button key={type} type="button" onClick={() => setBoxType(type)}
                      className="px-3 py-2 rounded-lg border text-[12px] font-mono transition-all"
                      style={boxType === type ? { background:"rgba(59,130,246,0.12)", color:"#3b82f6", borderColor:"rgba(59,130,246,0.45)" } : { color:"#9ca3af", borderColor:"rgba(255,255,255,0.08)" }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Altura (mm)</label>
                  <input type="number" value={altura} onChange={e => setAltura(e.target.value)} placeholder="200" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Largura (mm)</label>
                  <input type="number" value={largura} onChange={e => setLargura(e.target.value)} placeholder="200" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Profundidade (mm)</label>
                  <input type="number" value={profundidade} onChange={e => setProfundidade(e.target.value)} placeholder="200" className={inputCls} />
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Link de compra (opcional)</label>
                <input value={buyLink} onChange={e => setBuyLink(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>
          <button
            disabled={!canNext[step]}
            onClick={() => step < 4 ? setStep(s => s + 1) : handleFinish()}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 4 ? "Adicionar caixa" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ Add Material Modal ══════════════════════════════════════════ */

const MAT_TYPES = ["PLA","PETG","ABS","TPU","ASA","PLA+","PA","PC","HIPS","Resina"];
const PRESET_COLORS = [
  { name:"Branco",     hex:"#F5F5F5" }, { name:"Preto",      hex:"#1A1A1A" },
  { name:"Cinza",      hex:"#9CA3AF" }, { name:"Vermelho",   hex:"#EF4444" },
  { name:"Azul",       hex:"#3B82F6" }, { name:"Verde",      hex:"#10B981" },
  { name:"Amarelo",    hex:"#F59E0B" }, { name:"Laranja",    hex:"#F97316" },
  { name:"Roxo",       hex:"#A78BFA" }, { name:"Rosa",       hex:"#EC4899" },
  { name:"Ciano",      hex:"#06B6D4" }, { name:"Marrom",     hex:"#92400E" },
  { name:"Transparente", hex:"#CBD5E1"},{ name:"Prata",      hex:"#C0C0C0" },
  { name:"Dourado",    hex:"#D97706" }, { name:"Madeira",    hex:"#B45309" },
];

function AddMaterialModal({ onClose, onAdd, printers }: {
  onClose: () => void;
  onAdd: (f: Filament) => void;
  printers: PM[];
}) {
  const [step, setStep]           = useState(1);
  const [matKind, setMatKind]     = useState<"Filamento"|"Caixa"|"LED">("Filamento");
  // step 2
  const [color,   setColor]       = useState(PRESET_COLORS[0].hex);
  const [colorName, setColorName] = useState(PRESET_COLORS[0].name);
  const [customHex, setCustomHex] = useState("");
  const [matType, setMatType]     = useState("PLA");
  const [diameter, setDiameter]   = useState("1.75");
  const [openedAt, setOpenedAt]   = useState("");
  // step 3
  const [perKg,   setPerKg]       = useState("");
  const [fullG,   setFullG]       = useState("1000");
  const [availG,  setAvailG]      = useState("1000");
  // step 4
  const [buyLink, setBuyLink]     = useState("");
  const [selPrinters, setSelPrinters] = useState<string[]>([]);

  const perGram = perKg ? (parseFloat(perKg) / 1000).toFixed(4) : "—";

  const togglePrinter = (name: string) =>
    setSelPrinters(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  const effectiveColor = customHex.match(/^#[0-9a-fA-F]{6}$/) ? customHex : color;

  const handleFinish = () => {
    const brand = matType;
    const f: Filament = {
      id: `f${Date.now()}`,
      material: matType,
      brand,
      color: colorName || customHex,
      colorHex: effectiveColor,
      diameter: diameter === "2.85" ? 2.85 : 1.75,
      initial: parseFloat(fullG) || 1000,
      current: parseFloat(availG) || 1000,
      costPerKg: parseFloat(perKg) || 0,
      printers: selPrinters,
      openedAt: openedAt || new Date().toLocaleDateString("pt-BR"),
      usage: [],
    };
    onAdd(f);
    onClose();
  };

  const canNext: Record<number, boolean> = {
    1: true,
    2: !!openedAt,
    3: !!perKg && !!fullG && !!availG,
    4: true,
  };

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors";
  const labelCls = "text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block";

  const STEPS = ["Tipo", "Características", "Custos", "Opcionais"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[520px] max-h-[90vh] bg-card border border-border rounded-2xl flex flex-col shadow-2xl shadow-black/60" style={{ animation:"fadeIn 180ms ease" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-5 border-b border-border flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-foreground">Adicionar material</div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">Passo {step} de 4 — {STEPS[step-1]}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1.5 px-6 pt-5 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{ background: i < step ? "#3b82f6" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.1) transparent" }}>

          {/* ── Step 1: Tipo ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[12px] text-muted-foreground font-mono">Selecione o tipo de material que deseja cadastrar.</p>
              <div className="space-y-2">
                {(["Filamento","Caixa","LED"] as const).map(kind => (
                  <button key={kind} onClick={() => setMatKind(kind)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left"
                    style={matKind === kind ? { borderColor:"#3b82f6", background:"rgba(59,130,246,0.1)" } : { borderColor:"rgba(255,255,255,0.08)", background:"transparent" }}
                  >
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{kind}</div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {kind==="Filamento"?"Carretéis de filamento para impressão FDM/FFF":kind==="Caixa"?"Embalagens e caixas de envio":"Fitas e módulos LED"}
                      </div>
                    </div>
                    {matKind === kind && <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
              {matKind !== "Filamento" && (
                <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-[12px] font-mono text-muted-foreground">
                  Cadastro de <strong className="text-foreground">{matKind}</strong> ainda não disponível. Em breve!
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Características ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Tipo de filamento</label>
                <div className="flex flex-wrap gap-1.5">
                  {MAT_TYPES.map(t => (
                    <button key={t} onClick={() => setMatType(t)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-mono font-medium transition-all border"
                      style={matType===t ? { background:`${MAT_COLOR[t]??"#3b82f6"}22`, color:MAT_COLOR[t]??"#3b82f6", borderColor:`${MAT_COLOR[t]??"#3b82f6"}40` } : { color:"#6b7280", borderColor:"rgba(255,255,255,0.08)" }}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Cor</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map(c => (
                    <button key={c.hex} onClick={() => { setColor(c.hex); setColorName(c.name); setCustomHex(""); }}
                      className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0"
                      style={{ background:c.hex, borderColor:color===c.hex && !customHex?"white":"rgba(255,255,255,0.15)" }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-border flex-shrink-0" style={{ background:effectiveColor }} />
                  <input value={customHex} onChange={e => setCustomHex(e.target.value)} placeholder="Hex personalizado  ex: #FF6B35" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Diâmetro (mm)</label>
                  <div className="flex gap-2">
                    {["1.75","2.85"].map(d => (
                      <button key={d} onClick={() => setDiameter(d)}
                        className="flex-1 py-2 rounded-lg border text-[12px] font-mono transition-all"
                        style={diameter===d ? { background:"rgba(59,130,246,0.15)", color:"#3b82f6", borderColor:"rgba(59,130,246,0.4)" } : { color:"#6b7280", borderColor:"rgba(255,255,255,0.08)" }}
                      >{d} mm</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Data de abertura</label>
                  <input type="date" value={openedAt} onChange={e => setOpenedAt(e.target.value)} className={inputCls} style={{ colorScheme:"dark" }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Custos ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Por quilograma (R$)</label>
                  <input type="number" value={perKg} onChange={e => setPerKg(e.target.value)} placeholder="ex: 89,90" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Por grama (R$)</label>
                  <div className={`${inputCls} opacity-60 cursor-default`}>{perGram === "—" ? "—" : `R$ ${perGram}`}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Carretel cheio (g)</label>
                  <input type="number" value={fullG} onChange={e => setFullG(e.target.value)} placeholder="ex: 1000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Quantidade disponível (g)</label>
                  <input type="number" value={availG} onChange={e => setAvailG(e.target.value)} placeholder="ex: 1000" className={inputCls} />
                </div>
              </div>
              {perKg && fullG && (
                <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">Valor total do carretel</span>
                  <span className="text-[14px] font-bold font-display text-primary">
                    R$ {(parseFloat(perKg) * parseFloat(fullG) / 1000).toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Opcionais ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Link de compra (opcional)</label>
                <input value={buyLink} onChange={e => setBuyLink(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Impressoras compatíveis (opcional)</label>
                <div className="space-y-1.5">
                  {printers.map(p => (
                    <button key={p.id} onClick={() => togglePrinter(p.name)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                      style={selPrinters.includes(p.name) ? { borderColor:"#3b82f6", background:"rgba(59,130,246,0.08)" } : { borderColor:"rgba(255,255,255,0.08)" }}
                    >
                      <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                        style={selPrinters.includes(p.name) ? { background:"#3b82f6", borderColor:"#3b82f6" } : { borderColor:"rgba(255,255,255,0.2)" }}>
                        {selPrinters.includes(p.name) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[12px] font-medium text-foreground">{p.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto">{p.brand}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>
          <button
            disabled={!canNext[step] || (step === 1 && matKind !== "Filamento")}
            onClick={() => step < 4 ? setStep(s => s + 1) : handleFinish()}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 4 ? "Adicionar material" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ Create Custom Material Modal ═══════════════════════════════ */

const MATERIAL_UNITS = ["unidade","kg","g","m","cm","mm","ml","l","m²","m³"];
const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value:"opcoes", label:"Opções" },
  { value:"numerico", label:"Numérico" },
  { value:"aberto", label:"Aberto" },
  { value:"monetario", label:"Monetário" },
  { value:"data", label:"Data" },
  { value:"cor", label:"Cor" },
];

function CreateCustomMaterialModal({ onClose, onCreate }: { onClose: () => void; onCreate: (m: { name: string; plural: string; unit: string; fields: CustomMaterialField[] }) => void; }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [plural, setPlural] = useState("");
  const [unit, setUnit] = useState("unidade");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("aberto");
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionDraft, setOptionDraft] = useState("");
  const [multiSelect, setMultiSelect] = useState(false);
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fields, setFields] = useState<CustomMaterialField[]>([]);

  const resolvedPlural = plural.trim() || (name.trim() ? `${name.trim()}s` : "");

  const canContinue =
    step === 1 ? name.trim().length > 0 :
    step === 2 ? !!unit :
    true;

  const handleAddField = () => {
    if (!fieldName.trim()) return;
    if (fieldType === "opcoes" && fieldOptions.length === 0) return;

    setFields(prev => [{
      id: `field-${Date.now()}`,
      name: fieldName.trim(),
      type: fieldType,
      options: fieldType === "opcoes" ? fieldOptions : undefined,
      allowMultiple: fieldType === "opcoes" ? multiSelect : undefined,
      value: fieldType === "cor" ? "#3b82f6" : fieldType === "data" ? new Date().toISOString().slice(0,10) : undefined,
      required: fieldRequired,
    }, ...prev]);
    setFieldName("");
    setFieldType("aberto");
    setFieldOptions([]);
    setOptionDraft("");
    setMultiSelect(false);
    setFieldRequired(false);
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      plural: resolvedPlural,
      unit,
      fields,
    });
    onClose();
  };

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors";
  const labelCls = "text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[620px] max-h-[90vh] bg-card border border-border rounded-2xl flex flex-col shadow-2xl shadow-black/60" style={{ animation:"fadeIn 180ms ease" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-foreground">Criar material personalizado</div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">Passo {step} de 4</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="flex gap-1.5 px-6 pt-4 flex-shrink-0">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-1 h-1 rounded-full transition-all" style={{ background: index < step ? "#3b82f6" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.1) transparent" }}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="text-[14px] font-semibold text-foreground">Nome do material</div>
                <div className="text-[12px] text-muted-foreground font-mono mt-1 mb-4">Como esse material vai aparecer no sistema. Use o singular para o nome principal.</div>
              </div>
              <div>
                <label className={labelCls}>Nome do material <span className="text-muted-foreground">(singular)</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Fita LED" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Plural</label>
                <input value={plural} onChange={e => setPlural(e.target.value)} placeholder={name.trim() ? `${name.trim()}s` : "Ex.: Fitas LED"} className={inputCls} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="text-[14px] font-semibold text-foreground">Unidade de medida</div>
                <div className="text-[12px] text-muted-foreground font-mono mt-1 mb-4">Define como a quantidade desse material é contabilizada — por peça, peso, comprimento, etc.</div>
              </div>
              <div>
                <label className={labelCls}>Unidade de medida</label>
                <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls}>
                  {MATERIAL_UNITS.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="text-[14px] font-semibold text-foreground">Campos personalizados</div>
                <div className="text-[12px] text-muted-foreground font-mono mt-1 mb-2">Adicione campos extras para registrar informações específicas desse material. Esse passo é opcional.</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-3">
                <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
                  <div>
                    <label className={labelCls}>Nome do campo</label>
                    <input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="Ex.: Temperatura ideal" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tipo</label>
                    <select value={fieldType} onChange={e => setFieldType(e.target.value as CustomFieldType)} className={inputCls}>
                      {CUSTOM_FIELD_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                </div>

                {fieldType === "opcoes" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <label className={labelCls}>Permitir múltiplas opções</label>
                      </div>
                      <div className="group relative">
                        <button type="button" onClick={() => setMultiSelect(prev => !prev)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ background: multiSelect ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)" }} aria-label="Toggle múltiplas opções">
                          <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: multiSelect ? "translateX(22px)" : "translateX(4px)" }} />
                        </button>
                        <div className="pointer-events-none absolute right-0 top-8 z-10 w-52 rounded-lg border border-border bg-popover px-2 py-1 text-[10px] font-mono text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 shadow-lg">
                          Quando ativado, o usuário pode selecionar mais de uma opção.
                        </div>
                      </div>
                    </div>

                    <label className={labelCls}>Opções</label>
                    <div className="flex gap-2">
                      <input value={optionDraft} onChange={e => setOptionDraft(e.target.value)} placeholder="Ex.: Verde" className={inputCls} />
                      <button onClick={() => { if (!optionDraft.trim()) return; setFieldOptions(prev => [...prev, optionDraft.trim()]); setOptionDraft(""); }} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-[12px] font-medium hover:bg-primary/90">Adicionar</button>
                    </div>
                    {fieldOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {fieldOptions.map((option, index) => (
                          <div key={`${option}-${index}`} className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-muted border border-border text-[11px] font-mono">
                            {option}
                            <button onClick={() => setFieldOptions(prev => prev.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className={labelCls + " mb-0"}>Obrigatório</label>
                    <div className="group relative">
                      <button type="button" onClick={() => setFieldRequired(prev => !prev)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ background: fieldRequired ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)" }} aria-label="Toggle campo obrigatório">
                        <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: fieldRequired ? "translateX(22px)" : "translateX(4px)" }} />
                      </button>
                      <div className="pointer-events-none absolute left-0 top-8 z-10 w-60 rounded-lg border border-border bg-popover px-2 py-1 text-[10px] font-mono text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 shadow-lg">
                        Quando ativado, este campo será obrigatório no preenchimento do material.
                      </div>
                    </div>
                  </div>
                  <button onClick={handleAddField} disabled={!fieldName.trim() || (fieldType === "opcoes" && fieldOptions.length === 0)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[12px] font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">
                    Adicionar campo
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Campos criados</div>
                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted-foreground font-mono">Nenhum campo adicionado ainda.</div>
                ) : (
                  <div className="space-y-2">
                    {fields.map(field => (
                      <div key={field.id} className="rounded-xl border border-border bg-muted/10 px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-medium text-foreground">{field.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {field.type === "opcoes" && field.options && field.options.length > 0
                              ? `Opções: ${field.options.map((_, index) => index + 1).join(", ")}`
                              : CUSTOM_FIELD_TYPES.find(item => item.value === field.type)?.label}
                          </div>
                        </div>
                        <button onClick={() => setFields(prev => prev.filter(item => item.id !== field.id))} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <div className="text-[14px] font-semibold text-foreground">Confirmar criação</div>
                <div className="text-[12px] text-muted-foreground font-mono mt-1 mb-2">Revise as informações antes de criar o material. Você poderá editar os detalhes depois.</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Material</span>
                  <span className="text-[12px] font-medium text-foreground">{name || "Sem nome"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Plural</span>
                  <span className="text-[12px] font-medium text-foreground">{resolvedPlural || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Unidade</span>
                  <span className="text-[12px] font-medium text-foreground">{unit}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Campos extras</div>
                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-5 text-[12px] text-muted-foreground font-mono text-center">Nenhum campo extra configurado.</div>
                ) : (
                  fields.map(field => (
                    <div key={field.id} className="rounded-xl border border-border bg-muted/10 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-medium text-foreground">{field.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {field.type === "opcoes" && field.options && field.options.length > 0
                              ? `Opções: ${field.options.map((_, index) => index + 1).join(", ")}`
                              : CUSTOM_FIELD_TYPES.find(item => item.value === field.type)?.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>
          <button disabled={!canContinue} onClick={() => step < 4 ? setStep(s => s + 1) : handleCreate()} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {step === 4 ? "Criar material" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ Printer SVG ═════════════════════════════════════════════════ */

function PrinterSvg({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <line x1="14" y1="10" x2="14" y2="70" stroke={color} strokeWidth="2.5" strokeOpacity="0.28" strokeLinecap="round"/>
      <line x1="66" y1="10" x2="66" y2="70" stroke={color} strokeWidth="2.5" strokeOpacity="0.28" strokeLinecap="round"/>
      <rect x="10" y="7" width="60" height="7" rx="3" fill={color} fillOpacity="0.42"/>
      <rect x="14" y="25" width="52" height="4.5" rx="2" fill={color} fillOpacity="0.48"/>
      <rect x="33" y="22" width="14" height="11" rx="2" fill={color} fillOpacity="0.28"/>
      <path d="M37 33 L40 42 L43 33Z" fill={color} fillOpacity="0.65"/>
      <rect x="14" y="63" width="52" height="5" rx="2" fill={color} fillOpacity="0.28"/>
      <rect x="18" y="55" width="44" height="9" rx="1.5" fill={color} fillOpacity="0.05" stroke={color} strokeWidth="0.75" strokeOpacity="0.22"/>
      <rect x="22" y="60" width="36" height="2.5" rx="1" fill={color} fillOpacity="0.38"/>
      <rect x="22" y="57" width="28" height="2.5" rx="1" fill={color} fillOpacity="0.26"/>
      <rect x="22" y="54" width="18" height="2.5" rx="1" fill={color} fillOpacity="0.15"/>
    </svg>
  );
}

/* ══ Maintenance Timeline ════════════════════════════════════════ */

function Timeline({ history, next }: { history: MEvent[]; next: string }) {
  const isCur = (e: MEvent) => e.dur?.toLowerCase().includes("andamento") ?? false;
  const nodes = [
    ...history.map(e => ({ ...e, isNext:false, cur:isCur(e) })),
    ...(!history.some(isCur) && history.length > 0
      ? [{ id:"nxt", date:"PRÓXIMA", type:"preventiva" as MType, desc:next, isNext:true, cur:false, cost:undefined, dur:undefined }]
      : []),
  ];
  if (nodes.length === 0) return <div className="py-8 text-center text-[12px] text-muted-foreground font-mono">Nenhuma manutenção registrada — equipamento novo</div>;
  return (
    <div className="overflow-x-auto pb-3" style={{ scrollbarWidth:"none" }}>
      <div className="flex items-start" style={{ minWidth:"max-content" }}>
        {nodes.map((node, i) => {
          const cfg   = MTYPE[node.type];
          const color = node.isNext ? "#10b981" : node.cur ? "#f59e0b" : cfg.color;
          const Icon  = node.isNext ? Calendar : cfg.Icon;
          return (
            <div key={node.id} className="flex items-start">
              {i > 0 && (
                <div className="w-10 flex-shrink-0" style={{ marginTop:"38px" }}>
                  <div className="h-px w-full" style={node.isNext ? { borderTop:"1px dashed rgba(16,185,129,0.4)" } : { background:"rgba(255,255,255,0.08)" }} />
                </div>
              )}
              <div className="flex flex-col items-center w-[126px]">
                <div className="text-[9px] font-mono font-bold mb-2 text-center" style={{ color:node.isNext ? "#10b981" : "rgba(255,255,255,0.28)" }}>{node.date}</div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 relative flex-shrink-0" style={{ borderColor:color, background:`${color}18`, boxShadow:node.isNext || node.cur ? `0 0 14px ${color}38` : "none" }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                  {node.cur && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-card animate-pulse" />}
                </div>
                <div className="mt-2 text-center px-1">
                  {!node.isNext && <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wide mb-0.5">{cfg.label}</div>}
                  <div className="text-[10px] font-medium leading-snug" style={{ color:node.isNext ? "#10b981" : "rgba(255,255,255,0.7)" }}>{node.desc}</div>
                  {!node.isNext && node.cost !== undefined && <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{node.cost > 0 ? `R$ ${node.cost}` : "s/ custo"}{node.dur ? ` · ${node.dur}` : ""}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══ Printer Drawer ══════════════════════════════════════════════ */

function PrinterDrawer({ p, onClose }: { p: PM | null; onClose: () => void }) {
  if (!p) return null;
  const sc = PSTATUS[p.status], ph = printerHealth(p), hl = hcl(ph);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[476px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <PrinterSvg color={sc.accent} size={44} />
            <div>
              <div className="text-[15px] font-semibold text-foreground leading-tight">{p.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{p.brand} · {p.model}</div>
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase" style={{ background:sc.bg, color:sc.accent }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background:sc.accent }} />{sc.label}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors flex-shrink-0"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth:"none" }}>
          <div>
            <div className="flex justify-between text-[11px] font-mono mb-1.5"><span className="text-muted-foreground">Vida útil restante ({(p.lifeHours - p.hours).toLocaleString("pt-BR")}h)</span><span style={{ color:hl }}>{ph}%</span></div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${ph}%`, background:hl }} /></div>
            <div className="flex justify-between text-[10px] font-mono mt-2">
              <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 mr-2">
                <div className="font-display font-bold text-foreground" style={{ fontSize:"18px" }}>{p.hours.toLocaleString("pt-BR")}h</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Horas atuais (h)</div>
              </div>
              <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1">
                <div className="font-display font-bold text-foreground" style={{ fontSize:"18px" }}>{p.lifeHours.toLocaleString("pt-BR")}h</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Vida útil (h)</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Operação</div>
            <div className="grid grid-cols-2 gap-2.5">
              {[{ val:`${p.uptime}%`, lbl:"Disponibilidade" },{ val:`${p.history.length}`, lbl:"Manutenções" }].map(({ val, lbl }) => (
                <div key={lbl} className="bg-background rounded-lg p-3 border border-border">
                  <div className="font-display font-bold text-foreground" style={{ fontSize:"20px" }}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          {(() => {
            const deprH  = p.valorPago / p.lifeHours;
            const enerH  = (p.potenciaW / 1000) * 0.90;
            const manutH = p.hours > 0 ? p.history.reduce((s, e) => s + (e.cost ?? 0), 0) / p.hours : 0;
            const totalH = deprH + enerH + manutH;
            const cph = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });
            const rows = [
              { lbl:"Depreciação/h",   val:`R$ ${cph(deprH)}`,  accent:"#a78bfa" },
              { lbl:"Energia/h",       val:`R$ ${cph(enerH)}`,  accent:"#f59e0b" },
              { lbl:"Manutenção/h",    val:`R$ ${cph(manutH)}`, accent:"#10b981" },
            ];
            return (
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Custos & Operação</div>
                <div className="rounded-xl border border-border overflow-hidden">
                  {rows.map(({ lbl, val, accent }, i) => (
                    <div key={lbl} className={`flex items-center justify-between px-4 py-2.5 ${i < rows.length - 1 ? "border-b border-border" : ""}`}>
                      <span className="text-[11px] font-mono text-muted-foreground">{lbl}</span>
                      <span className="text-[11px] font-mono font-medium" style={{ color: accent }}>{val}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-t-2 border-primary/30">
                    <span className="text-[12px] font-bold font-mono text-foreground tracking-wide">CUSTO TOTAL/H</span>
                    <span className="text-[14px] font-bold font-display" style={{ color:"#3b82f6" }}>R$ {cph(totalH)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Especificações</div>
            <div className="space-y-2">
              {[{ lbl:"Volume de construção", val:`${p.vol.x} × ${p.vol.y} × ${p.vol.z} mm` },{ lbl:"Data de aquisição", val:p.acquired },{ lbl:"Valor pago", val:`R$ ${p.valorPago.toLocaleString("pt-BR")}` },{ lbl:"Potência", val:`${p.potenciaW} W` }].map(({ lbl, val }) => (
                <div key={lbl} className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground font-mono">{lbl}</span>
                  <span className="text-foreground font-mono">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Materiais compatíveis</div>
            <div className="flex flex-wrap gap-1.5">{p.mats.map(m => <span key={m} className="text-[11px] font-mono px-2.5 py-1 rounded bg-muted/40 text-foreground border border-border">{m}</span>)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Próximas manutenções</div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background border border-border">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2" style={{ borderColor:"#10b981", background:"rgba(16,185,129,0.12)", boxShadow:"0 0 14px rgba(16,185,129,0.25)" }}>
                <Calendar className="w-4 h-4" style={{ color:"#10b981" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-foreground leading-snug">Manutenção preventiva programada</div>
                <div className="text-[11px] font-mono mt-0.5" style={{ color:"#10b981" }}>{p.next}</div>
              </div>
            </div>
          </div>
          {p.history.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-3">Histórico de manutenções</div>
              <div className="space-y-2">
                {[...p.history].reverse().map(ev => {
                  const cfg = MTYPE[ev.type];
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border" style={{ background:`${cfg.color}18`, borderColor:cfg.color }}><cfg.Icon className="w-3.5 h-3.5" style={{ color:cfg.color }} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2"><span className="text-[12px] font-medium text-foreground leading-snug">{ev.desc}</span><span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{ev.date}</span></div>
                        <div className="flex items-center gap-3 mt-0.5"><span className="text-[9px] font-mono text-muted-foreground/50 uppercase">{cfg.label}</span>{ev.cost !== undefined && <span className="text-[9px] font-mono text-muted-foreground">{ev.cost > 0 ? `R$ ${ev.cost}` : "Sem custo"}</span>}{ev.dur && <span className="text-[9px] font-mono text-muted-foreground">{ev.dur}</span>}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"><Plus className="w-3.5 h-3.5" /> Registrar manutenção</button>
          <button className="px-4 py-2.5 rounded-lg border border-border text-[13px] text-foreground hover:bg-muted/40 transition-colors">Editar</button>
        </div>
      </div>
    </div>
  );
}

/* ══ Printer Card ════════════════════════════════════════════════ */

function PrinterCard({ p, onClick }: { p: PM; onClick: () => void }) {
  const sc = PSTATUS[p.status], ph = printerHealth(p), hl = hcl(ph);
  return (
    <button onClick={onClick} className="text-left rounded-xl border border-border bg-card overflow-hidden group hover:border-white/[0.16] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40">
      <div className="relative flex items-center justify-center h-[128px] border-b border-border" style={{ background:`${sc.accent}09` }}>
        <PrinterSvg color={sc.accent} size={70} />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-[0.08em] font-mono" style={{ background:sc.bg, color:sc.accent }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background:sc.accent }} />{sc.label}
        </div>
        {p.status === "manutencao" && <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[9px] text-amber-400 font-mono"><Wrench className="w-3 h-3" /> Em manutenção</div>}
      </div>
      <div className="p-4">
        <div className="mb-3"><div className="text-[14px] font-semibold text-foreground leading-tight">{p.name}</div><div className="text-[11px] text-muted-foreground font-mono mt-0.5">{p.brand} · Adq. {p.acquired}</div></div>
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono mb-1"><span className="text-muted-foreground">Vida útil restante</span><span style={{ color:hl }}>{ph}%</span></div>
          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${ph}%`, background:hl }} /></div>
          <div className="flex justify-between text-[9px] font-mono mt-1 text-muted-foreground/50"><span>{p.hours.toLocaleString("pt-BR")}h usadas</span><span>{p.lifeHours.toLocaleString("pt-BR")}h vida útil</span></div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {[{ val:`${p.vol.x}×${p.vol.y}×${p.vol.z}`, lbl:"Volume (mm)" },{ val:`R$ ${p.cph.toFixed(2)}/h`, lbl:"Custo/hora" },{ val:`${p.hours.toLocaleString("pt-BR")}h`, lbl:"Horas totais" },{ val:`${p.uptime}%`, lbl:"Disponib." }].map(({ val, lbl }) => (
            <div key={lbl}><div className="text-[11px] font-mono font-medium text-foreground">{val}</div><div className="text-[10px] text-muted-foreground font-mono">{lbl}</div></div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="text-[10px] font-mono text-muted-foreground/60 truncate mr-2">Próxima: {p.next}</div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 transition-colors" />
        </div>
      </div>
    </button>
  );
}

/* ══ Dashboard page ══════════════════════════════════════════════ */

type PK = "1d" | "7d" | "1m" | "custom";
const PERIOD_LABELS: Record<PK, string> = {
  "1d":     "Hoje (1 dia)",
  "7d":     "Últimos 7 dias",
  "1m":     "Último mês",
  "custom": "Período personalizado",
};
const PERIOD_VALS: Record<"1d" | "7d" | "1m", { value: string; sub: string }[]> = {
  "1d": [
    { value:"3",        sub:"0 confirmados vs ontem"  },
    { value:"R$ 640",   sub:"pico do dia: R$ 890"     },
    { value:"R$ 370",   sub:"após custos e overhead"  },
    { value:"59,1%",    sub:"dentro da meta"          },
  ],
  "7d": [
    { value:"14",        sub:"+3 vs semana anterior"   },
    { value:"R$ 3.280",  sub:"+8% vs semana anterior"  },
    { value:"R$ 1.892",  sub:"após custos e overhead"  },
    { value:"57,7%",     sub:"+1 pp vs semana ant."    },
  ],
  "1m": [
    { value:"38",        sub:"+5 vs período anterior"  },
    { value:"R$ 18.420", sub:"+12% vs período anterior"},
    { value:"R$ 10.644", sub:"após custos e overhead"  },
    { value:"57,8%",     sub:"+3 pp vs período ant."   },
  ],
};

function DashboardContent() {
  const [jobs, setJobs]         = useState<Job[]>(INIT_JOBS);
  const [dragId, setDragId]     = useState<string | null>(null);
  const [overCol, setOverCol]   = useState<KStatus | null>(null);
  const [period, setPeriod]     = useState<PK>("1m");
  const [periodOpen, setPOpen]  = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const drop = (col: KStatus) => { if (dragId) setJobs(p => p.map(j => j.id === dragId ? { ...j, status:col } : j)); setDragId(null); setOverCol(null); };
  const cells = HEATMAP.flat().filter(c => !c.future);
  const totalH = cells.reduce((s, c) => s + c.v, 0), maxH = Math.max(...cells.map(c => c.v));
  const activeDays = cells.filter(c => c.v > 0).length;
  const avgH = activeDays > 0 ? (totalH / activeDays).toFixed(1) : "0";

  const kpiVals = PERIOD_VALS[period === "custom" ? "1m" : period];
  const periodLabel = period === "custom" && dateFrom && dateTo
    ? `${dateFrom.slice(8)}.${dateFrom.slice(5,7)} → ${dateTo.slice(8)}.${dateTo.slice(5,7)}`
    : PERIOD_LABELS[period];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth:"none" }}>

      {/* ── Period selector row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">Exibindo dados de:</span>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-[12px] font-mono hover:bg-muted/40 transition-colors min-w-[180px]"
            style={periodOpen ? { borderColor:"rgba(59,130,246,0.4)" } : {}}
          >
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground flex-1 text-left">{PERIOD_LABELS[period]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform" style={periodOpen ? { transform:"rotate(180deg)" } : {}} />
          </button>

          {periodOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPOpen(false)} />
              <div className="absolute left-0 top-9 z-20 w-64 rounded-xl border border-border bg-card shadow-xl shadow-black/40 overflow-hidden" style={{ animation:"fadeIn 120ms ease" }}>
                {(["1d","7d","1m"] as PK[]).map(p => (
                  <button key={p} onClick={() => { setPeriod(p); setPOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-mono hover:bg-muted/40 transition-colors"
                    style={{ color: period===p ? "#3b82f6" : "#9ca3af" }}
                  >
                    {PERIOD_LABELS[p]}
                    {period===p && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
                <div className="border-t border-border">
                  <button
                    onClick={() => { setPeriod("custom"); setPOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-mono hover:bg-muted/40 transition-colors"
                    style={{ color: period==="custom" ? "#3b82f6" : "#6b7280" }}
                  >
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    Selecione no calendário
                    {period==="custom" && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Custom date range — appears inline when custom is selected */}
        {period === "custom" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
            <input
              type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-foreground focus:outline-none w-28"
              style={{ colorScheme:"dark" }}
            />
            <span className="text-muted-foreground text-[10px] font-mono">→</span>
            <input
              type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-foreground focus:outline-none w-28"
              style={{ colorScheme:"dark" }}
            />
          </div>
        )}
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map(({ label, Icon, accent, bg }, i) => {
          const { value, sub } = kpiVals[i] ?? { value:"—", sub:"" };
          return (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-mono">{label}</span><div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background:bg }}><Icon className="w-3.5 h-3.5" style={{ color:accent }} /></div></div>
              <div className="font-display font-bold leading-none mb-1.5" style={{ fontSize:"28px", color:accent }}>{value}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{sub}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[284px_1fr] gap-3">
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col h-[440px]">
          <h2 className="text-[13px] font-semibold text-foreground mb-0.5 shrink-0">Estoque de Filamentos</h2>
          <p className="text-[11px] text-muted-foreground font-mono mb-4 shrink-0">nível atual por material · {FILS_D.length} bobinas</p>
          <div className="overflow-y-auto flex-1 pr-1 space-y-[18px]" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.12) transparent" }}>
            {FILS_D.map(f => { const pct=f.g/f.max, col=fc(pct), badge=pct<0.2?"CRÍTICO":pct<0.4?"BAIXO":null; return (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:col }} /><span className="text-[12px] font-medium text-foreground">{f.name}</span></div><div className="flex items-center gap-1.5">{badge && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background:`${col}22`, color:col }}>{badge}</span>}<span className="text-[11px] font-medium font-mono" style={{ color:col }}>{f.g}g</span></div></div>
                <div className="h-[5px] rounded-full bg-muted/40 overflow-hidden"><div className="h-full rounded-full" style={{ width:`${Math.round(pct*100)}%`, background:col }} /></div>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">{f.brand} · {Math.round(pct*100)}% de {f.max}g</div>
              </div>
            ); })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div><h2 className="text-[13px] font-semibold text-foreground">Uso das Impressoras</h2><p className="text-[11px] text-muted-foreground mt-0.5 font-mono">horas de impressão por dia · 22 semanas</p></div>
            <div className="flex items-center gap-1.5"><span className="text-[9px] text-muted-foreground font-mono">menos</span>{[0,2,5,7,10].map(v => <div key={v} className="w-3 h-3 rounded-[2px]" style={{ background:hc(v,false) }} />)}<span className="text-[9px] text-muted-foreground font-mono">mais</span></div>
          </div>
          <div className="flex pl-6 mb-1 gap-[3px]">{HEATMAP.map((_, wi) => <div key={wi} className="w-3 shrink-0 text-[8px] text-muted-foreground font-mono overflow-visible whitespace-nowrap">{monthAt(wi) ?? ""}</div>)}</div>
          <div className="flex">
            <div className="flex flex-col gap-[3px] mr-2 w-4 mt-0.5">{DA.map((d, i) => <div key={i} className="h-3 text-[8px] text-muted-foreground font-mono leading-3">{i%2!==0?d:""}</div>)}</div>
            <div className="flex gap-[3px]">{HEATMAP.map((week, wi) => <div key={wi} className="flex flex-col gap-[3px]">{week.map((cell, di) => <div key={di} className="w-3 h-3 rounded-[2px] cursor-pointer transition-transform hover:scale-110" style={{ background:hc(cell.v,cell.future) }} title={`${cell.date.toLocaleDateString("pt-BR")}: ${cell.future?"—":`${cell.v}h`}`} />)}</div>)}</div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-border">
            {[{ label:"Total período", val:`${totalH}h` },{ label:"Pico diário", val:`${maxH}h` },{ label:"Média ativa", val:`${avgH}h` },{ label:"Dias ativos", val:`${activeDays}` }].map(({ label, val }) => (
              <div key={label}><div className="font-display font-bold text-foreground" style={{ fontSize:"20px" }}>{val}</div><div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{label}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4"><div><h2 className="text-[13px] font-semibold text-foreground">Fila de Impressão</h2><p className="text-[11px] text-muted-foreground font-mono">{jobs.length} pedidos ativos · arraste os cards para mover entre etapas</p></div></div>
        <div className="grid grid-cols-4 gap-3 overflow-x-auto">
          {KCOLS.map(col => { const colJobs=jobs.filter(j=>j.status===col.id), isOver=overCol===col.id; return (
            <div key={col.id} onDragOver={e=>{e.preventDefault();setOverCol(col.id);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOverCol(null);}} onDrop={()=>drop(col.id)} className="rounded-lg min-h-[180px] min-w-[170px] transition-colors" style={{ background:isOver?`${col.accent}0f`:"rgba(255,255,255,0.018)", borderTop:`2px solid ${col.accent}`, borderLeft:`1px solid ${isOver?col.accent+"40":"rgba(255,255,255,0.07)"}`, borderRight:`1px solid ${isOver?col.accent+"40":"rgba(255,255,255,0.07)"}`, borderBottom:`1px solid ${isOver?col.accent+"40":"rgba(255,255,255,0.07)"}` }}>
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] font-mono" style={{ color:col.accent }}>{col.label}</span>
                <div className="flex items-center gap-1.5">
                  {colJobs.some(j=>j.urgent) && <span className="text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">urgente</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium font-mono" style={{ background:`${col.accent}22`, color:col.accent }}>{colJobs.length}</span>
                </div>
              </div>
              <div className="px-2 pb-2 space-y-2">
                {colJobs.map(job => (
                  <div key={job.id} draggable onDragStart={()=>setDragId(job.id)} onDragEnd={()=>{setDragId(null);setOverCol(null);}} className={`rounded-lg border bg-background p-3 cursor-grab active:cursor-grabbing select-none transition-all ${dragId===job.id?"opacity-40 scale-[0.96]":"hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30"}`} style={{ borderColor: job.urgent ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full mt-[3px] flex-shrink-0" style={{ background:job.dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <div className="text-[12px] font-medium text-foreground leading-snug truncate">{job.part}</div>
                          {job.urgent && <span className="flex-shrink-0 text-[8px] font-bold font-mono uppercase px-1 py-0.5 rounded bg-red-500/15 text-red-400">⚡ urgente</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{job.order} · {job.client}</div>
                      </div>
                    </div>
                    {job.progress !== undefined && <div className="mb-2"><div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-mono"><span>{job.progress}%</span><span>ETA {job.eta}</span></div><div className="h-[3px] rounded-full bg-muted/40 overflow-hidden"><div className="h-full rounded-full" style={{ width:`${job.progress}%`, background:col.accent }} /></div></div>}
                    <div className="flex flex-wrap gap-1 mt-1">{[job.material, job.printer].map(tag => <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono">{tag}</span>)}</div>
                  </div>
                ))}
                {colJobs.length === 0 && <div className="h-16 rounded-lg border border-dashed border-border flex items-center justify-center"><span className="text-[10px] text-muted-foreground/40 font-mono">vazio</span></div>}
              </div>
            </div>
          ); })}
        </div>
      </div>
      <div className="h-1" />
    </div>
  );
}

/* ══ Impressoras page ════════════════════════════════════════════ */

function ImpressorasContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter]         = useState<PStatus | "todas">("todas");
  const selected = PRINTERS.find(p => p.id === selectedId) ?? null;
  const filtered = filter === "todas" ? PRINTERS : PRINTERS.filter(p => p.status === filter);
  const cnt = { todas:PRINTERS.length, ativa:PRINTERS.filter(p=>p.status==="ativa").length, manutencao:PRINTERS.filter(p=>p.status==="manutencao").length, inativa:PRINTERS.filter(p=>p.status==="inativa").length };
  const avgHealth = Math.round(PRINTERS.reduce((s,p)=>s+printerHealth(p),0)/PRINTERS.length);
  const avgUptime = (PRINTERS.reduce((s,p)=>s+p.uptime,0)/PRINTERS.length).toFixed(1);
  const totalHrs  = PRINTERS.reduce((s,p)=>s+p.hours,0);
  const TABS: { id:PStatus|"todas"; label:string; accent?:string }[] = [
    { id:"todas", label:`Todas (${cnt.todas})` },
    { id:"ativa", label:`Ativas (${cnt.ativa})`, accent:"#10b981" },
    { id:"manutencao", label:`Manutenção (${cnt.manutencao})`, accent:"#f59e0b" },
    { id:"inativa", label:`Inativas (${cnt.inativa})`, accent:"#ef4444" },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth:"none" }}>
      <div className="flex items-center justify-between">
        <div><h2 className="text-[15px] font-semibold text-foreground">Impressoras & Máquinas</h2><p className="text-[11px] text-muted-foreground font-mono mt-0.5">{cnt.ativa} ativas · {cnt.manutencao} em manutenção · {cnt.inativa} inativas</p></div>
        <button className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" /> Cadastrar impressora</button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[{ val:cnt.ativa.toString(), lbl:"Impressoras ativas", accent:"#10b981" },{ val:`${totalHrs.toLocaleString("pt-BR")}h`, lbl:"Horas operadas (total)", accent:"#3b82f6" },{ val:`${avgUptime}%`, lbl:"Disponib. média", accent:"#a78bfa" },{ val:`${avgHealth}%`, lbl:"Saúde média", accent:hcl(avgHealth) }].map(({ val, lbl, accent }) => (
          <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5"><div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div><div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div></div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all"
            style={filter===t.id ? { background:t.accent?`${t.accent}18`:"rgba(59,130,246,0.15)", color:t.accent??"#3b82f6" } : { color:"#6b7280" }}
          >{t.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(p => <PrinterCard key={p.id} p={p} onClick={() => setSelectedId(p.id)} />)}
      </div>
      <PrinterDrawer p={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ══ Materiais page ══════════════════════════════════════════════ */

function MateriaisContent() {
  const [activeTab, setActiveTab]     = useState<"filamento" | "caixas" | "leds">("filamento");
  const [filaments, setFilaments]     = useState<Filament[]>(INIT_FILAMENTS);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [matFilter, setMatFilter]     = useState("todas");
  const [hexFilter, setHexFilter]     = useState<string | null>(null);
  const [showUsage, setShowUsage]     = useState(false);
  const [usagePresel, setUsagePresel] = useState<string | undefined>(undefined);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showCustomMaterialModal, setShowCustomMaterialModal] = useState(false);
  const [caixas, setCaixas]               = useState<CaixaItem[]>(INIT_CAIXAS);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [boxFiltersOpen, setBoxFiltersOpen] = useState(false);
  const [boxFilters, setBoxFilters] = useState({
    type: "todos" as "todos" | (typeof BOX_TYPE_OPTIONS)[number],
    stock: "todos" as "todos" | "ok" | "baixo" | "critico",
    altura: { min: "", max: "" },
    largura: { min: "", max: "" },
    profundidade: { min: "", max: "" },
  });

  const selected   = filaments.find(f => f.id === selectedId) ?? null;
  const allColors  = [...new Map(filaments.map(f => [f.colorHex, f.color])).entries()];
  const filtered   = filaments.filter(f => {
    if (matFilter !== "todas" && f.material !== matFilter) return false;
    if (hexFilter && f.colorHex !== hexFilter) return false;
    return true;
  });
  const deduct = (id: string, grams: number, job: string) => {
    const dateStr = `${TODAY.getDate()} ${MPT[TODAY.getMonth()]} ${TODAY.getFullYear()}`;
    setFilaments(prev => prev.map(f =>
      f.id !== id ? f : { ...f, current: Math.max(0, f.current - grams), usage: [{ id:`u${Date.now()}`, date:dateStr, grams, job:job||undefined }, ...f.usage] }
    ));
    setShowUsage(false);
  };
  const openUsage  = (preselect?: string) => { setUsagePresel(preselect); setShowUsage(true); };
  const critCount  = filaments.filter(f => f.current / f.initial < 0.2).length;
  const totalGrams = filaments.reduce((s, f) => s + f.current, 0);
  const totalValue = filaments.reduce((s, f) => s + f.current * f.costPerKg / 1000, 0);
  const activeMats = MAT_ORDER.filter(m => filaments.some(f => f.material === m));
  const showGroups = matFilter === "todas" && hexFilter === null;
  const groups     = MAT_ORDER.filter(m => filtered.some(f => f.material === m)).map(m => ({ mat:m, items:filtered.filter(f => f.material === m) }));

  const TABS = [
    { id:"filamento" as const, label:"Filamento" },
    { id:"caixas"    as const, label:"Caixas"    },
    { id:"leds"      as const, label:"LEDs"      },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth:"none" }}>
      {/* Tab bar + action buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-muted/20 border border-border rounded-lg p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium font-mono transition-all"
              style={activeTab === t.id ? { background:"rgba(59,130,246,0.18)", color:"#3b82f6" } : { color:"#6b7280" }}
            >{t.label}</button>
          ))}
          <button
            onClick={() => setShowCustomMaterialModal(true)}
            className="flex items-center justify-center w-9 h-8 rounded-md border border-border bg-background/50 text-[18px] leading-none text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Criar material personalizado"
            title="Criar material personalizado"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {activeTab === "filamento" && (
          <div className="flex items-center gap-2">
            <button onClick={() => openUsage()} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-foreground text-[13px] font-medium hover:bg-muted/40 transition-colors">
              <Minus className="w-4 h-4" /> Registrar uso
            </button>
            <button onClick={() => setShowAddMaterialModal(true)} className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Adicionar filamento
            </button>
          </div>
        )}
        {activeTab === "caixas" && (
          <button onClick={() => setShowAddBoxModal(true)} className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Adicionar caixa
          </button>
        )}
      </div>

      {/* ── Filamento tab ── */}
      {activeTab === "filamento" && (<>
        <div className="grid grid-cols-4 gap-3">
          {[
            { val:filaments.length.toString(),          lbl:"Carretéis ativos",      accent:"#3b82f6" },
            { val:`${(totalGrams/1000).toFixed(2)}kg`,  lbl:"Peso total disponível", accent:"#10b981" },
            { val:`R$ ${totalValue.toFixed(0)}`,        lbl:"Valor em estoque",      accent:"#a78bfa" },
            { val:critCount.toString(),                 lbl:"Nível crítico",         accent:critCount>0?"#ef4444":"#10b981" },
          ].map(({ val, lbl, accent }) => (
            <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
              <div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {["todas", ...activeMats].map(m => (
              <button key={m} onClick={() => setMatFilter(m)} className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all"
                style={matFilter===m ? { background:m==="todas"?"rgba(59,130,246,0.15)":`${MAT_COLOR[m]??("#3b82f6")}18`, color:m==="todas"?"#3b82f6":MAT_COLOR[m]??"#3b82f6" } : { color:"#6b7280" }}
              >{m === "todas" ? `Todos (${filaments.length})` : m}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground font-mono">Cor:</span>
            <button onClick={() => setHexFilter(null)} className="text-[10px] font-mono px-2 py-1 rounded transition-all" style={hexFilter===null?{background:"rgba(59,130,246,0.15)",color:"#3b82f6"}:{color:"#6b7280"}}>Todas</button>
            {allColors.map(([hex, name]) => (
              <button key={hex} onClick={() => setHexFilter(hexFilter===hex?null:hex)} className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0"
                style={{ background:hex, borderColor:hexFilter===hex?"white":"rgba(255,255,255,0.18)" }} title={name} />
            ))}
          </div>
        </div>
        {showGroups ? (
          <div className="space-y-7">
            {groups.map(({ mat, items }) => (
              <div key={mat}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-4 rounded-full" style={{ background:MAT_COLOR[mat]??"#6b7280" }} />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.1em]" style={{ color:MAT_COLOR[mat]??"#6b7280" }}>{mat}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-mono text-muted-foreground/40">{items.length} carretel{items.length!==1?"s":""}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {items.map(f => <SpoolCard key={f.id} f={f} onClick={() => setSelectedId(f.id)} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          filtered.length === 0
            ? <div className="py-16 text-center"><div className="text-[12px] text-muted-foreground font-mono">Nenhum filamento para os filtros selecionados</div></div>
            : <div className="flex flex-wrap gap-3">{filtered.map(f => <SpoolCard key={f.id} f={f} onClick={() => setSelectedId(f.id)} />)}</div>
        )}
        <FilamentDrawer f={selected} onClose={() => setSelectedId(null)} onUsage={() => openUsage(selectedId ?? undefined)} />
        {showUsage && <UsageModal filaments={filaments} preselect={usagePresel} onClose={() => setShowUsage(false)} onConfirm={deduct} />}
        {showAddMaterialModal && (
          <AddMaterialModal
            printers={PRINTERS}
            onClose={() => setShowAddMaterialModal(false)}
            onAdd={(newFilament) => {
              setFilaments(prev => [newFilament, ...prev]);
              setActiveTab("filamento");
            }}
          />
        )}
        {showCustomMaterialModal && (
          <CreateCustomMaterialModal
            onClose={() => setShowCustomMaterialModal(false)}
            onCreate={({ name, plural, unit, fields }) => {
              const created: Filament = {
                id: `f${Date.now()}`,
                material: name,
                brand: name,
                color: name,
                colorHex: "#3b82f6",
                diameter: 1.75,
                initial: 0,
                current: 0,
                costPerKg: 0,
                printers: [],
                openedAt: new Date().toLocaleDateString("pt-BR"),
                usage: [],
                customFields: fields,
              };
              setFilaments(prev => [created, ...prev]);
              setActiveTab("filamento");
            }}
          />
        )}
      </>)}

      {/* ── Caixas tab ── */}
      {activeTab === "caixas" && (<>
        {(() => {
          const totalUnits  = caixas.reduce((s, b) => s + b.current, 0);
          const totalVal    = caixas.reduce((s, b) => s + b.current * b.costPerUnit, 0);
          const critBoxes   = caixas.filter(b => b.current / b.initial < 0.2).length;
          const selectedBox = caixas.find(b => b.id === selectedBoxId) ?? null;
          const filteredCaixas = caixas.filter(b => {
            const typeMatch = boxFilters.type === "todos" || getBoxTypeValue(b) === boxFilters.type;
            const stockMatch = boxFilters.stock === "todos" || getBoxStockLevel(b) === boxFilters.stock;
            const altura = getBoxFieldValue(b, "Altura (mm)");
            const largura = getBoxFieldValue(b, "Largura (mm)");
            const profundidade = getBoxFieldValue(b, "Profundidade (mm)");
            const alturaMin = boxFilters.altura.min === "" ? null : Number(boxFilters.altura.min);
            const alturaMax = boxFilters.altura.max === "" ? null : Number(boxFilters.altura.max);
            const larguraMin = boxFilters.largura.min === "" ? null : Number(boxFilters.largura.min);
            const larguraMax = boxFilters.largura.max === "" ? null : Number(boxFilters.largura.max);
            const profundidadeMin = boxFilters.profundidade.min === "" ? null : Number(boxFilters.profundidade.min);
            const profundidadeMax = boxFilters.profundidade.max === "" ? null : Number(boxFilters.profundidade.max);

            const alturaOk = alturaMin === null || altura >= alturaMin;
            const alturaOkMax = alturaMax === null || altura <= alturaMax;
            const larguraOk = larguraMin === null || largura >= larguraMin;
            const larguraOkMax = larguraMax === null || largura <= larguraMax;
            const profundidadeOk = profundidadeMin === null || profundidade >= profundidadeMin;
            const profundidadeOkMax = profundidadeMax === null || profundidade <= profundidadeMax;

            return typeMatch && stockMatch && alturaOk && alturaOkMax && larguraOk && larguraOkMax && profundidadeOk && profundidadeOkMax;
          });
          const activeFilters = [
            boxFilters.type !== "todos",
            boxFilters.stock !== "todos",
            boxFilters.altura.min !== "" || boxFilters.altura.max !== "",
            boxFilters.largura.min !== "" || boxFilters.largura.max !== "",
            boxFilters.profundidade.min !== "" || boxFilters.profundidade.max !== "",
          ].filter(Boolean).length;

          const resetBoxFilters = () => setBoxFilters({
            type: "todos",
            stock: "todos",
            altura: { min: "", max: "" },
            largura: { min: "", max: "" },
            profundidade: { min: "", max: "" },
          });

          return (<>
            <div className="grid grid-cols-4 gap-3">
              {[
                { val:caixas.length.toString(),    lbl:"Caixas cadastradas",  accent:"#3b82f6" },
                { val:`${totalUnits} un.`,         lbl:"Unidades em estoque", accent:"#10b981" },
                { val:`R$ ${totalVal.toFixed(0)}`, lbl:"Valor em estoque",    accent:"#a78bfa" },
                { val:critBoxes.toString(),        lbl:"Nível crítico",       accent:critBoxes>0?"#ef4444":"#10b981" },
              ].map(({ val, lbl, accent }) => (
                <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
                  <div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-foreground">Filtros</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{activeFilters > 0 ? `${activeFilters} filtros ativos` : "Nenhum filtro aplicado"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeFilters > 0 && (
                    <button onClick={resetBoxFilters} className="px-2.5 py-1.5 rounded-md border border-border text-[11px] font-mono text-muted-foreground hover:bg-muted/40 transition-colors">
                      Limpar
                    </button>
                  )}
                  <button onClick={() => setBoxFiltersOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors">
                    <Sliders className="w-3.5 h-3.5" /> Abrir filtros
                    {activeFilters > 0 && (
                      <span className="min-w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold px-1">{activeFilters}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {filteredCaixas.length === 0
              ? <div className="py-16 text-center"><div className="text-[12px] text-muted-foreground font-mono">Nenhuma caixa corresponde aos filtros selecionados.</div></div>
              : <div className="flex flex-wrap gap-3">{filteredCaixas.map(b => <BoxCard key={b.id} b={b} onClick={() => setSelectedBoxId(b.id)} />)}</div>
            }
            <BoxDrawer b={selectedBox} onClose={() => setSelectedBoxId(null)} />
            <BoxFilterDrawer
              open={boxFiltersOpen}
              filters={boxFilters}
              onChange={setBoxFilters}
              onClose={() => setBoxFiltersOpen(false)}
              onReset={() => {
                resetBoxFilters();
                setBoxFiltersOpen(false);
              }}
            />
            {showAddBoxModal && (
              <AddBoxModal
                onClose={() => setShowAddBoxModal(false)}
                onAdd={(nb) => { setCaixas(prev => [nb, ...prev]); setShowAddBoxModal(false); }}
              />
            )}
          </>);
        })()}
      </>)}

      {/* ── LEDs tab ── */}
      {activeTab === "leds" && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center bg-muted/20"><Sliders className="w-6 h-6 text-muted-foreground/40" /></div>
          <div className="text-[13px] font-medium text-muted-foreground">Gestão de LEDs em breve</div>
          <div className="text-[11px] font-mono text-muted-foreground/50">Controle de fitas, módulos e consumo</div>
        </div>
      )}
    </div>
  );
}

/* ══ Catálogo page ═══════════════════════════════════════════════ */

function CatalogoContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [catFilter,  setCatFilter]  = useState<ModelCat | "Todos">("Todos");
  const [search,     setSearch]     = useState("");

  const selected = MODELS.find(m => m.id === selectedId) ?? null;

  const cats = ["Todos", ...Object.keys(CAT_COLOR)] as (ModelCat | "Todos")[];

  const filtered = MODELS.filter(m => {
    if (catFilter !== "Todos" && m.category !== catFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const totalModels   = MODELS.length;
  const totalPrints   = MODELS.reduce((s, m) => s + m.printCount, 0);
  const avgMargin     = (() => {
    const margins = MODELS.map(m => {
      const vol = m.volume * (0.12 + 3 * 0.028 + (1 - 0.12 - 3 * 0.028) * (m.slice.infill / 100));
      const cost = vol * 1.24 * ((CPK[m.materialType] ?? 89) / 1000) + m.estimatedTime * DEFAULT_CPH;
      return m.sellPrice > 0 ? (m.sellPrice - cost) / m.sellPrice * 100 : 0;
    });
    return Math.round(margins.reduce((a, b) => a + b, 0) / margins.length);
  })();
  const topModel = [...MODELS].sort((a, b) => b.printCount - a.printCount)[0];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth:"none" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Catálogo de Modelos</h2>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{totalModels} modelos · {totalPrints} impressões totais</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Adicionar modelo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { val:totalModels.toString(),       lbl:"Modelos no catálogo",  accent:"#3b82f6" },
          { val:totalPrints.toString(),        lbl:"Impressões realizadas",accent:"#10b981" },
          { val:`${avgMargin}%`,               lbl:"Margem média estimada",accent:"#a78bfa" },
          { val:topModel.name.split(" ").slice(0,2).join(" "), lbl:`Mais impresso (${topModel.printCount}×)`, accent:"#f59e0b" },
        ].map(({ val, lbl, accent }) => (
          <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
            <div className="font-display font-bold truncate" style={{ fontSize:"18px", color:accent }}>{val}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all"
              style={catFilter===c
                ? { background:c==="Todos"?"rgba(59,130,246,0.15)":`${CAT_COLOR[c as ModelCat]}18`, color:c==="Todos"?"#3b82f6":CAT_COLOR[c as ModelCat] }
                : { color:"#6b7280" }
              }
            >
              {c !== "Todos" && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:CAT_COLOR[c as ModelCat] }} />}
              {c === "Todos" ? `Todos (${MODELS.length})` : `${c} (${MODELS.filter(m=>m.category===c).length})`}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar modelo ou tag..."
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50 transition-colors w-52"
          />
        </div>
      </div>

      {/* Photo masonry grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-[12px] text-muted-foreground font-mono">Nenhum modelo encontrado</div>
        </div>
      ) : (
        <div style={{ columns:3, gap:"16px" }}>
          {filtered.map(m => (
            <ModelCard key={m.id} m={m} onClick={() => setSelectedId(m.id)} />
          ))}
        </div>
      )}

      {/* Drawer with live calculator */}
      {selected && <ModelDrawer m={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

/* ══ Gestão de Clientes ══════════════════════════════════════════ */

const TAG_CFG: Record<ClientTag, { label: string; accent: string; bg: string }> = {
  vip:          { label:"VIP",          accent:"#f59e0b", bg:"rgba(245,158,11,0.12)"  },
  atacado:      { label:"Atacado",      accent:"#3b82f6", bg:"rgba(59,130,246,0.12)"  },
  novo:         { label:"Novo",         accent:"#10b981", bg:"rgba(16,185,129,0.12)"  },
  inativo:      { label:"Inativo",      accent:"#6b7280", bg:"rgba(107,114,128,0.12)" },
  problematico: { label:"Problemático", accent:"#ef4444", bg:"rgba(239,68,68,0.12)"   },
};

const ltvScore = (c: Client): "high" | "mid" | "low" => {
  const days = c.orders.length
    ? (TODAY.getTime() - Math.max(...c.orders.map(o => o.date.getTime()))) / 864e5
    : 999;
  if (c.ltv >= 800 && days <= 60) return "high";
  if (c.ltv >= 200 || days <= 90) return "mid";
  return "low";
};
const LTV_C: Record<string, string> = { high:"#10b981", mid:"#f59e0b", low:"#6b7280" };
const LTV_L: Record<string, string> = { high:"Alto valor", mid:"Médio valor", low:"Inativo" };
const CD = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const INIT_CLIENTS: Client[] = [
  {
    id:"c1", name:"RoboLab UFMG", initials:"RU", avatarColor:"#4f46e5",
    email:"compras@robolab.ufmg.br", phone:"(31) 98712-3344",
    address:{ street:"Av. Antônio Carlos, 6627", city:"Belo Horizonte", state:"MG" },
    tags:["vip","atacado"],
    preferences:"Prefere PLA+ para peças funcionais. Prazo mínimo 5 dias úteis.",
    notes:"Conta universitária — NF obrigatória. Contato: Eng. Lucas Moreira.",
    ltv:1840,
    orders:[
      { num:"#050", date:CD(2026,8,2),  total:640, status:"imprimindo" },
      { num:"#034", date:CD(2026,5,18), total:720, status:"entregue"   },
      { num:"#028", date:CD(2026,2,10), total:480, status:"entregue"   },
    ],
  },
  {
    id:"c2", name:"FabLab Curitiba", initials:"FC", avatarColor:"#0891b2",
    email:"pedidos@fablabcwb.com.br", phone:"(41) 97234-5566",
    address:{ street:"R. Pasteur, 350", city:"Curitiba", state:"PR" },
    tags:["atacado"],
    preferences:"Bulk orders — desconto 10% acima de R$ 500.",
    ltv:1250,
    orders:[
      { num:"#051", date:CD(2026,8,5),  total:380, status:"pronto"   },
      { num:"#044", date:CD(2026,7,22), total:190, status:"entregue" },
      { num:"#031", date:CD(2026,5,3),  total:680, status:"entregue" },
    ],
  },
  {
    id:"c3", name:"MakerShop SP", initials:"MS", avatarColor:"#7c3aed",
    email:"maker@makershopsp.com.br", phone:"(11) 93488-7712",
    address:{ street:"R. Voluntários da Pátria, 1200", city:"São Paulo", state:"SP" },
    tags:["vip","atacado"],
    ltv:945,
    orders:[
      { num:"#054", date:CD(2026,8,8),  total:440, status:"confirmado" },
      { num:"#047", date:CD(2026,7,28), total:285, status:"na_fila"    },
      { num:"#021", date:CD(2026,3,14), total:220, status:"entregue"   },
    ],
  },
  {
    id:"c4", name:"Eletrotec Ltda", initials:"EL", avatarColor:"#b45309",
    email:"suprimentos@eletrotec.ind.br", phone:"(19) 94100-2233",
    address:{ street:"Rod. SP-65, km 12", city:"Campinas", state:"SP" },
    tags:["atacado"],
    preferences:"Peças técnicas em ABS. Emissão de NF. Pagamento em 30 dias.",
    notes:"Aprovação necessária antes de iniciar qualquer pedido novo.",
    ltv:1110,
    orders:[
      { num:"#055", date:CD(2026,8,10), total:690, status:"orcamento"  },
      { num:"#048", date:CD(2026,7,30), total:420, status:"confirmado" },
    ],
  },
  {
    id:"c5", name:"Geek Store BH", initials:"GB", avatarColor:"#be185d",
    email:"compras@geekstorebh.com", phone:"(31) 99100-5588",
    address:{ street:"Shopping Diamond Mall, L134", city:"Belo Horizonte", state:"MG" },
    tags:["vip","novo"],
    notes:"Primeiro pedido grande. Acompanhar satisfação pós-entrega.",
    ltv:1200,
    orders:[
      { num:"#053", date:CD(2026,8,6), total:1200, status:"na_fila" },
    ],
  },
  {
    id:"c6", name:"Studio Pixel", initials:"SP", avatarColor:"#0f766e",
    email:"oi@studiopixel.design", phone:"(21) 98055-4411",
    tags:["novo"],
    preferences:"Decorativos coloridos. Qualidade prima sobre velocidade.",
    ltv:390,
    orders:[
      { num:"#049", date:CD(2026,8,1),  total:150, status:"orcamento" },
      { num:"#043", date:CD(2026,6,20), total:240, status:"entregue"  },
    ],
  },
  {
    id:"c7", name:"Studio Noir", initials:"SN", avatarColor:"#475569",
    email:"contato@studionoir.art", phone:"(11) 97744-3322",
    preferences:"Peças artísticas com acabamento pós-processado.",
    tags:[], ltv:435,
    orders:[
      { num:"#042", date:CD(2026,8,3),  total:95,  status:"pronto"   },
      { num:"#036", date:CD(2026,6,10), total:340, status:"entregue" },
    ],
  },
  {
    id:"c8", name:"Nexus Tech", initials:"NT", avatarColor:"#0369a1",
    email:"procurement@nexustech.io", phone:"(11) 95500-8899",
    address:{ street:"Av. Paulista, 2300, 12° andar", city:"São Paulo", state:"SP" },
    tags:["vip"],
    notes:"Canal direto: Slack #nexustech-print.",
    preferences:"Protótipos PETG/ABS. Alta precisão exigida.",
    ltv:2340,
    orders:[
      { num:"#052", date:CD(2026,8,4),  total:890,  status:"entregue" },
      { num:"#037", date:CD(2026,6,5),  total:1150, status:"entregue" },
      { num:"#018", date:CD(2026,1,20), total:300,  status:"entregue" },
    ],
  },
  {
    id:"c9", name:"Loja Virtual SP", initials:"LV", avatarColor:"#991b1b",
    email:"pedidos@lojavirtualsp.com.br", phone:"(11) 94477-6655",
    tags:["inativo"],
    notes:"Pedido #039 cancelado. Verificar motivo antes de retomar contato.",
    ltv:660,
    orders:[
      { num:"#039", date:CD(2026,8,1),   total:220, status:"cancelado" },
      { num:"#011", date:CD(2025,11,15), total:440, status:"entregue"  },
    ],
  },
];

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const score    = ltvScore(client);
  const scoreC   = LTV_C[score];
  const sorted   = [...client.orders].sort((a, b) => b.date.getTime() - a.date.getTime());
  const lastOrd  = sorted[0] ?? null;
  const daysSince = lastOrd ? Math.floor((TODAY.getTime() - lastOrd.date.getTime()) / 864e5) : null;
  const noContact = daysSince !== null && daysSince > 30;
  const avgVal    = client.orders.length ? Math.round(client.ltv / client.orders.length) : 0;

  return (
    <button onClick={onClick} className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-white/[0.16] hover:shadow-lg hover:shadow-black/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <OAvatar initials={client.initials} color={client.avatarColor} size={44} />
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card" style={{ background:scoreC }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground leading-tight truncate">{client.name}</div>
          {client.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {client.tags.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase" style={{ background:TAG_CFG[t].bg, color:TAG_CFG[t].accent }}>
                  {TAG_CFG[t].label}
                </span>
              ))}
            </div>
          )}
        </div>
        {noContact && (
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-400">+30d</span>
        )}
      </div>

      <div className="flex items-center justify-between py-2.5 border-t border-b border-border my-2">
        {[
          { val:`R$ ${client.ltv.toLocaleString("pt-BR")}`, lbl:"lifetime" },
          { val:client.orders.length.toString(),             lbl:"pedidos"  },
          { val:`R$ ${avgVal}`,                              lbl:"ticket"   },
        ].map(({ val, lbl }) => (
          <div key={lbl} className="text-center flex-1">
            <div className="text-[13px] font-display font-bold text-foreground">{val}</div>
            <div className="text-[9px] font-mono text-muted-foreground">{lbl}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate mt-1.5">
        <Mail className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">{client.email}</span>
      </div>
      {lastOrd && (
        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono" style={{ color:noContact?"#f59e0b":"#6b7280" }}>
          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
          <span>último: {lastOrd.num} · {daysSince}d atrás</span>
        </div>
      )}
    </button>
  );
}

function ClientDrawer({ client, onClose }: { client: Client | null; onClose: () => void }) {
  if (!client) return null;
  const score   = ltvScore(client);
  const scoreC  = LTV_C[score];
  const sorted  = [...client.orders].sort((a, b) => b.date.getTime() - a.date.getTime());
  const lastOrd = sorted[0] ?? null;
  const daysSince = lastOrd ? Math.floor((TODAY.getTime() - lastOrd.date.getTime()) / 864e5) : null;
  const isAtRisk  = daysSince !== null && daysSince > 30;
  const avgVal    = client.orders.length ? Math.round(client.ltv / client.orders.length) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[480px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="relative flex-shrink-0">
                <OAvatar initials={client.initials} color={client.avatarColor} size={52} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card" style={{ background:scoreC }} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-foreground">{client.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background:scoreC }} />
                  <span className="text-[11px] font-mono" style={{ color:scoreC }}>{LTV_L[score]}</span>
                </div>
                {client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {client.tags.map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase" style={{ background:TAG_CFG[t].bg, color:TAG_CFG[t].accent }}>
                        {TAG_CFG[t].label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth:"none" }}>
          {/* At-risk banner */}
          {isAtRisk && (
            <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-amber-300">Reengajar cliente</div>
                <div className="text-[11px] text-amber-400/80 mt-0.5">Sem pedidos há {daysSince} dias.</div>
              </div>
              <button
                onClick={() => toast.success("Lembrete agendado", { description:`Contato com ${client.name} em 2 dias` })}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-mono transition-colors"
              >Agendar</button>
            </div>
          )}

          {/* Contact */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Contato</div>
            <div className="space-y-1.5">
              <a href={`mailto:${client.email}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border hover:border-white/[0.16] transition-colors group">
                <Mail className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                <span className="text-[12px] font-mono text-foreground truncate">{client.email}</span>
              </a>
              <a href={`tel:${client.phone}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border hover:border-white/[0.16] transition-colors group">
                <Phone className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                <span className="text-[12px] font-mono text-foreground">{client.phone}</span>
              </a>
              {client.address && (
                <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-background border border-border">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] text-foreground">{client.address.street}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{client.address.city} · {client.address.state}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LTV metrics */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Métricas</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val:`R$ ${client.ltv.toLocaleString("pt-BR")}`, lbl:"Lifetime value",  c:scoreC    },
                { val:client.orders.length.toString(),             lbl:"Total pedidos",   c:"#3b82f6" },
                { val:`R$ ${avgVal}`,                              lbl:"Ticket médio",    c:"#a78bfa" },
              ].map(({ val, lbl, c }) => (
                <div key={lbl} className="px-3 py-2.5 rounded-xl bg-background border border-border text-center">
                  <div className="font-display font-bold text-[16px]" style={{ color:c }}>{val}</div>
                  <div className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-tight">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences / Notes */}
          {(client.preferences || client.notes) && (
            <div className="space-y-3">
              {client.preferences && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-2">Preferências</div>
                  <div className="px-4 py-3 rounded-xl bg-background border border-border text-[12px] text-foreground leading-relaxed">{client.preferences}</div>
                </div>
              )}
              {client.notes && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-2">Observações</div>
                  <div className="px-4 py-3 rounded-xl bg-background border border-border text-[12px] text-foreground leading-relaxed">{client.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Order timeline */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Histórico de pedidos</div>
            <div className="space-y-2">
              {sorted.map(ord => {
                const sc = STATUS_CFG[ord.status];
                return (
                  <div key={ord.num} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:sc.accent }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-foreground">{ord.num}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase" style={{ background:sc.bg, color:sc.accent }}>{sc.label}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {ord.date.getDate()} {MPT[ord.date.getMonth()]} {ord.date.getFullYear()}
                      </div>
                    </div>
                    <div className="text-[13px] font-display font-bold text-foreground flex-shrink-0">R$ {ord.total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            Novo pedido
          </button>
          <button
            onClick={() => toast.info(`WhatsApp: ${client.phone}`, { description:"Copie o número acima" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-[13px] font-medium hover:bg-muted/40 transition-colors text-foreground"
          >
            <Phone className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientesContent() {
  const [clients]    = useState<Client[]>(INIT_CLIENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [tagFilter,  setTagFilter]  = useState<ClientTag | "todos" | "atRisk">("todos");

  const selected = clients.find(c => c.id === selectedId) ?? null;

  const atRiskIds = new Set(
    clients.filter(c => {
      const last = c.orders.length ? Math.max(...c.orders.map(o => o.date.getTime())) : 0;
      return (TODAY.getTime() - last) / 864e5 > 30;
    }).map(c => c.id)
  );

  const visible = clients.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
    if (tagFilter === "atRisk") return atRiskIds.has(c.id);
    if (tagFilter === "todos")  return true;
    return c.tags.includes(tagFilter);
  });

  const totalLTV    = clients.reduce((s, c) => s + c.ltv, 0);
  const vipCount    = clients.filter(c => c.tags.includes("vip")).length;
  const atRiskCount = atRiskIds.size;
  const activeCount = clients.filter(c => !atRiskIds.has(c.id) && c.orders.length > 0).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5 pb-3 flex-shrink-0 space-y-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Gestão de Clientes</h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {clients.length} clientes · LTV total: R$ {totalLTV.toLocaleString("pt-BR")}
            </p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo cliente
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { val:clients.length.toString(),  lbl:"Total de clientes", accent:"#3b82f6" },
            { val:activeCount.toString(),      lbl:"Ativos (30d)",      accent:"#10b981" },
            { val:vipCount.toString(),         lbl:"Clientes VIP",      accent:"#f59e0b" },
            { val:atRiskCount.toString(),      lbl:"Para reengajar",    accent:atRiskCount>0?"#ef4444":"#10b981" },
          ].map(({ val, lbl, accent }) => (
            <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
              <div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Search + tag filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nome ou e-mail..."
              className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-[12px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["todos","vip","atacado","novo","inativo","problematico","atRisk"] as const).map(f => {
              const isActive = tagFilter === f;
              const cnt      = f === "todos"  ? clients.length
                             : f === "atRisk" ? atRiskCount
                             : clients.filter(c => c.tags.includes(f as ClientTag)).length;
              if (f !== "todos" && f !== "atRisk" && cnt === 0) return null;
              const label  = f === "todos"  ? `Todos (${cnt})`
                           : f === "atRisk" ? `+30d sem pedido (${cnt})`
                           : `${TAG_CFG[f as ClientTag].label} (${cnt})`;
              const accent = f === "todos"  ? "#3b82f6"
                           : f === "atRisk" ? "#f59e0b"
                           : TAG_CFG[f as ClientTag].accent;
              return (
                <button key={f} onClick={() => setTagFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all whitespace-nowrap"
                  style={isActive ? { background:`${accent}18`, color:accent } : { color:"#6b7280" }}
                >{label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto p-5 pt-4" style={{ scrollbarWidth:"thin" }}>
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="font-display font-bold text-muted-foreground/20 mb-1" style={{ fontSize:"36px" }}>∅</div>
              <p className="text-[12px] text-muted-foreground font-mono">Nenhum cliente encontrado</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {visible.map(c => (
              <ClientCard key={c.id} client={c} onClick={() => setSelectedId(c.id)} />
            ))}
          </div>
        )}
      </div>

      <ClientDrawer client={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ══ Gestão de Pedidos ═══════════════════════════════════════════ */

const GANTT_S = new Date(2026, 6, 7);   // Jul 7
const GANTT_E = new Date(2026, 8, 22);  // Sep 22

const deadlineUrg = (deadline: Date, status: OrderStatus): "ok" | "soon" | "late" | "done" => {
  if (status === "entregue" || status === "cancelado") return "done";
  const diff = (deadline.getTime() - TODAY.getTime()) / 864e5;
  if (diff < 0) return "late";
  if (diff <= 3) return "soon";
  return "ok";
};
const URG_C: Record<string, string> = { ok:"#10b981", soon:"#f59e0b", late:"#ef4444", done:"#6b7280" };

function OAvatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width:size, height:size, background:color, fontSize:Math.floor(size * 0.36) }}
    >{initials}</div>
  );
}

function OrderCard({ order, onClick, onDragStart, onDragEnd, isDragging }: {
  order: Order; onClick: () => void;
  onDragStart: () => void; onDragEnd: () => void; isDragging: boolean;
}) {
  const sc   = STATUS_CFG[order.status];
  const urg  = deadlineUrg(order.deadline, order.status);
  const urgC = URG_C[urg];
  const isLate   = urg === "late";
  const payPct   = order.total > 0 ? (order.deposit / order.total) * 100 : 0;
  const paid     = payPct >= 100;
  const partial  = payPct > 0 && payPct < 100;
  const dDiff    = Math.ceil((order.deadline.getTime() - TODAY.getTime()) / 864e5);
  const dLabel   = urg === "done" ? `${order.deadline.getDate()} ${MPT[order.deadline.getMonth()]}`
                 : isLate ? `${Math.abs(dDiff)}d atrás`
                 : dDiff === 0 ? "hoje"
                 : `${order.deadline.getDate()} ${MPT[order.deadline.getMonth()]}`;
  return (
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      className="rounded-lg border border-border bg-background p-3 cursor-grab active:cursor-grabbing select-none transition-all relative hover:border-white/[0.16] hover:shadow-lg hover:shadow-black/30"
      style={isDragging ? { opacity:0.4, transform:"scale(0.96)" } : {}}
    >
      {isLate && (
        <div className="absolute -top-2 right-2.5 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase bg-destructive text-white animate-pulse">
          ATRASADO
        </div>
      )}
      <div className="flex items-start gap-2 mb-2">
        <OAvatar initials={order.initials} color={order.avatarColor} size={24} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono text-muted-foreground leading-tight">{order.num}</div>
          <div className="text-[12px] font-semibold text-foreground truncate leading-tight">{order.client}</div>
        </div>
      </div>
      <div className="mb-2.5">
        <div className="text-[11px] text-foreground truncate">
          {order.items[0].model}{order.items[0].qty > 1 ? ` ×${order.items[0].qty}` : ""}
        </div>
        {order.items.length > 1 && (
          <div className="text-[10px] font-mono text-muted-foreground">
            +{order.items.length - 1} item{order.items.length > 2 ? "s" : ""}
          </div>
        )}
      </div>
      {order.status === "imprimindo" && order.progress !== undefined && (
        <div className="mb-2.5">
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
            <span>Progresso</span><span>{order.progress}%</span>
          </div>
          <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${order.progress}%`, background:sc.accent }} />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold" style={{ background:`${urgC}18`, color:urgC }}>
          <Calendar className="w-2.5 h-2.5 flex-shrink-0" />{dLabel}
        </div>
        <div className="text-right">
          <div className="text-[12px] font-display font-bold text-foreground">R$ {order.total}</div>
          {partial && <div className="text-[8px] font-mono" style={{ color:"#f59e0b" }}>{payPct.toFixed(0)}% pago</div>}
          {paid && order.status !== "entregue" && <div className="text-[8px] font-mono" style={{ color:"#10b981" }}>pago</div>}
        </div>
      </div>
    </div>
  );
}

function OrderDrawer({ order, onClose, onStatusChange }: {
  order: Order | null; onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  if (!order) return null;
  const sc      = STATUS_CFG[order.status];
  const urg     = deadlineUrg(order.deadline, order.status);
  const urgC    = URG_C[urg];
  const balance = order.total - order.deposit;
  const payPct  = order.total > 0 ? (order.deposit / order.total) * 100 : 0;
  const dDiff   = Math.ceil((order.deadline.getTime() - TODAY.getTime()) / 864e5);
  const dDesc   = urg === "done" ? "—"
                : urg === "late" ? `${Math.abs(dDiff)} dia${Math.abs(dDiff)!==1?"s":""} atrasado`
                : `em ${dDiff} dia${dDiff!==1?"s":""}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation:"fadeIn 150ms ease" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[460px] h-full bg-card border-l border-border flex flex-col" style={{ animation:"slideRight 200ms ease" }}>
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <OAvatar initials={order.initials} color={order.avatarColor} size={42} />
              <div>
                <div className="text-[15px] font-semibold text-foreground">{order.client}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  {order.num} · criado em {order.createdAt.getDate()} {MPT[order.createdAt.getMonth()]}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase" style={{ background:sc.bg, color:sc.accent }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background:sc.accent }} />{sc.label}
                  </span>
                  {urg === "late" && <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-destructive/20 text-red-400">Atrasado</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth:"none" }}>
          {/* Deadline banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ borderColor:`${urgC}35`, background:`${urgC}0c` }}>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color:urgC }} />
              <div>
                <div className="text-[10px] font-mono text-muted-foreground">Prazo de entrega</div>
                <div className="text-[13px] font-semibold" style={{ color:urgC }}>
                  {order.deadline.getDate()} {MPT[order.deadline.getMonth()]} {order.deadline.getFullYear()}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono font-bold" style={{ color:urgC }}>{dDesc}</div>
          </div>

          {/* Items */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">
              Itens do pedido
            </div>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20" style={{ background:item.colorHex }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground truncate">{item.model}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{item.material} · {item.color}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[11px] font-mono text-foreground font-semibold">×{item.qty}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">R$ {(item.unitPrice * item.qty).toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Pagamento</div>
            <div className="px-4 py-3.5 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Forma</span>
                <span className="text-[12px] font-mono text-foreground">{PAY_LABEL[order.payment]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Valor total</span>
                <span className="text-[15px] font-display font-bold text-foreground">R$ {order.total.toFixed(2)}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-muted-foreground">Sinal pago</span>
                  <span className="text-[12px] font-mono" style={{ color:payPct>0?"#10b981":"#6b7280" }}>
                    R$ {order.deposit.toFixed(2)} ({payPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${payPct}%`, background:"#10b981" }} />
                </div>
              </div>
              {balance > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[12px] font-semibold text-foreground">Saldo a receber</span>
                  <span className="text-[15px] font-display font-bold" style={{ color:"#f59e0b" }}>R$ {balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Observações</div>
              <div className="px-4 py-3 rounded-xl bg-background border border-border text-[12px] text-foreground leading-relaxed">{order.notes}</div>
            </div>
          )}

          {/* Quick status advance */}
          {sc.next && (
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Avançar etapa</div>
              <button
                onClick={() => { onStatusChange(order.id, sc.next!); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[13px] font-medium transition-all hover:opacity-90"
                style={{ borderColor:STATUS_CFG[sc.next].accent, background:`${STATUS_CFG[sc.next].accent}14`, color:STATUS_CFG[sc.next].accent }}
              >
                <ArrowRight className="w-4 h-4" />
                Mover para &ldquo;{STATUS_CFG[sc.next].label}&rdquo;
              </button>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <button className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
            Editar pedido
          </button>
          <button
            onClick={() => toast.info("Comprovante pronto para impressão", { description:`${order.num} · ${order.client}` })}
            className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted/40 transition-colors"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GanttView({ orders, onCardClick }: { orders: Order[]; onCardClick: (o: Order) => void }) {
  const rS    = GANTT_S.getTime();
  const rE    = GANTT_E.getTime();
  const tPct  = Math.max(0, Math.min(100, (TODAY.getTime() - rS) / (rE - rS) * 100));
  const pct   = (d: Date) => Math.max(0, Math.min(100, (d.getTime() - rS) / (rE - rS) * 100));

  const ticks: Date[] = [];
  const t0 = new Date(GANTT_S);
  while (t0 <= GANTT_E) { ticks.push(new Date(t0)); t0.setDate(t0.getDate() + 7); }

  const rows = [...orders].filter(o => o.status !== "cancelado").sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-border" style={{ height:"34px" }}>
        <div className="w-[196px] flex-shrink-0 border-r border-border flex items-center px-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Pedido</span>
        </div>
        <div className="flex-1 relative overflow-hidden">
          {ticks.map((tick, i) => {
            const p = pct(tick);
            return (
              <div key={i} className="absolute top-0 bottom-0 flex" style={{ left:`${p}%` }}>
                <div className="w-px bg-border h-full" />
                <span className="text-[9px] font-mono text-muted-foreground/55 mt-1.5 ml-1 whitespace-nowrap">
                  {tick.getDate()} {MPT[tick.getMonth()]}
                </span>
              </div>
            );
          })}
          {/* Today label */}
          <div className="absolute top-1.5 z-20 text-[9px] font-mono font-bold text-primary whitespace-nowrap" style={{ left:`${tPct}%`, marginLeft:"3px" }}>hoje</div>
        </div>
      </div>
      {/* Rows */}
      {rows.map(order => {
        const sc     = STATUS_CFG[order.status];
        const urg    = deadlineUrg(order.deadline, order.status);
        const urgC   = URG_C[urg];
        const startP = Math.max(0, pct(order.createdAt));
        const endP   = Math.min(100, pct(order.deadline));
        const barW   = Math.max(0.5, endP - startP);

        return (
          <div key={order.id} className="flex border-b border-border hover:bg-muted/[0.04]" style={{ height:"44px" }}>
            <button
              onClick={() => onCardClick(order)}
              className="w-[196px] flex-shrink-0 border-r border-border flex items-center gap-2 px-3 hover:bg-muted/20 transition-colors"
            >
              <OAvatar initials={order.initials} color={order.avatarColor} size={22} />
              <div className="min-w-0 text-left">
                <div className="text-[11px] font-mono text-foreground">{order.num}</div>
                <div className="text-[9px] text-muted-foreground truncate">{order.client.split(" ")[0]}</div>
              </div>
            </button>
            <div className="flex-1 relative overflow-hidden">
              {/* Tick lines */}
              {ticks.map((tick, i) => <div key={i} className="absolute inset-y-0 w-px" style={{ left:`${pct(tick)}%`, background:"rgba(255,255,255,0.05)" }} />)}
              {/* Today line */}
              <div className="absolute inset-y-0 w-0.5 z-10" style={{ left:`${tPct}%`, background:"rgba(59,130,246,0.45)" }} />
              {/* Bar */}
              <div
                className="absolute top-3 h-5 rounded cursor-pointer flex items-center px-2 overflow-hidden transition-opacity hover:opacity-80"
                style={{ left:`${startP}%`, width:`${barW}%`, background:`${sc.accent}50`, border:`1px solid ${sc.accent}70`, minWidth:"6px" }}
                onClick={() => onCardClick(order)}
              >
                {barW > 10 && (
                  <span className="text-[9px] font-mono font-semibold truncate" style={{ color:"white" }}>
                    {order.client.split(" ")[0]}
                  </span>
                )}
                {urg === "late" && barW > 5 && (
                  <AlertTriangle className="w-2.5 h-2.5 ml-auto flex-shrink-0 text-red-400" />
                )}
              </div>
              {/* Deadline dot */}
              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-10 border-2 border-card" style={{ left:`${endP}%`, marginLeft:"-5px", background:urgC }} />
            </div>
          </div>
        );
      })}
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap px-4 py-2.5 border-t border-border bg-background/40">
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Status:</span>
        {ORDER_STATUSES.filter(s => s !== "cancelado").map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-4 h-2 rounded" style={{ background:`${STATUS_CFG[s].accent}60`, border:`1px solid ${STATUS_CFG[s].accent}80` }} />
            <span className="text-[9px] font-mono text-muted-foreground">{STATUS_CFG[s].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-mono text-muted-foreground">no prazo</span>
          <div className="w-2 h-2 rounded-full bg-amber-500 ml-2" />
          <span className="text-[9px] font-mono text-muted-foreground">urgente</span>
          <div className="w-2 h-2 rounded-full bg-red-500 ml-2" />
          <span className="text-[9px] font-mono text-muted-foreground">atrasado</span>
        </div>
      </div>
    </div>
  );
}

function PedidosContent() {
  const [orders,     setOrders]     = useState<Order[]>(INIT_ORDERS);
  const [view,       setView]       = useState<"kanban" | "gantt">("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId,     setDragId]     = useState<string | null>(null);
  const [overCol,    setOverCol]    = useState<OrderStatus | null>(null);
  const [statusFilt, setStatusFilt] = useState<OrderStatus | "todos">("todos");

  const selected = orders.find(o => o.id === selectedId) ?? null;

  const changeStatus = (id: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status:newStatus } : o));
    toast.success(`${order.num} → ${STATUS_CFG[newStatus].label}`, {
      description:`Notificação enviada para ${order.client}`, duration:4500,
    });
  };

  const drop = (col: OrderStatus) => {
    if (dragId) changeStatus(dragId, col);
    setDragId(null); setOverCol(null);
  };

  const active    = orders.filter(o => !["entregue","cancelado"].includes(o.status));
  const overdue   = orders.filter(o => deadlineUrg(o.deadline, o.status) === "late").length;
  const producing = orders.filter(o => o.status === "imprimindo").length;
  const aReceber  = active.reduce((s, o) => s + (o.total - o.deposit), 0);

  const visible = statusFilt === "todos" ? orders : orders.filter(o => o.status === statusFilt);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5 pb-3 flex-shrink-0 space-y-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Gestão de Pedidos</h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {active.length} ativos · {overdue > 0
                ? <span className="text-red-400">{overdue} atrasado{overdue>1?"s":""}</span>
                : "todos no prazo"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setView("kanban")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono transition-all"
                style={view==="kanban"?{background:"rgba(59,130,246,0.15)",color:"#3b82f6"}:{color:"#6b7280"}}
              ><Layers className="w-3.5 h-3.5" /> Kanban</button>
              <button onClick={() => setView("gantt")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono transition-all"
                style={view==="gantt"?{background:"rgba(59,130,246,0.15)",color:"#3b82f6"}:{color:"#6b7280"}}
              ><BarChart2 className="w-3.5 h-3.5" /> Gantt</button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Novo pedido
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { val:active.length.toString(),   lbl:"Pedidos ativos",  accent:"#3b82f6" },
            { val:`R$ ${aReceber.toFixed(0)}`, lbl:"A receber",       accent:"#10b981" },
            { val:producing.toString(),        lbl:"Em impressão",    accent:"#06b6d4" },
            { val:overdue.toString(),          lbl:"Atrasados",       accent:overdue>0?"#ef4444":"#10b981" },
          ].map(({ val, lbl, accent }) => (
            <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
              <div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Status filter tabs (Kanban only) */}
        {view === "kanban" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilt("todos")} className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all"
              style={statusFilt==="todos"?{background:"rgba(59,130,246,0.15)",color:"#3b82f6"}:{color:"#6b7280"}}
            >Todos ({orders.length})</button>
            {ORDER_STATUSES.map(s => {
              const cnt = orders.filter(o => o.status === s).length;
              if (cnt === 0) return null;
              const sc = STATUS_CFG[s];
              return (
                <button key={s} onClick={() => setStatusFilt(s)} className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all"
                  style={statusFilt===s?{background:`${sc.accent}18`,color:sc.accent}:{color:"#6b7280"}}
                >{sc.label} ({cnt})</button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Board / Gantt ── */}
      {view === "kanban" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 pt-4 pb-5" style={{ scrollbarWidth:"thin" }}>
          <div className="flex gap-3 h-full" style={{ minWidth:"max-content" }}>
            {ORDER_STATUSES.map(col => {
              const sc       = STATUS_CFG[col];
              const colOrds  = visible.filter(o => o.status === col);
              const isOver   = overCol === col;
              return (
                <div key={col}
                  onDragOver={e => { e.preventDefault(); setOverCol(col); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
                  onDrop={() => drop(col)}
                  className="flex flex-col rounded-xl border transition-all"
                  style={{
                    width:"210px", flexShrink:0,
                    borderColor:isOver?`${sc.accent}55`:"rgba(255,255,255,0.07)",
                    background:isOver?`${sc.accent}08`:"rgba(255,255,255,0.018)",
                    borderTop:`2px solid ${sc.accent}`,
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] font-mono" style={{ color:sc.accent }}>{sc.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ background:`${sc.accent}22`, color:sc.accent }}>{colOrds.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2" style={{ scrollbarWidth:"none", minHeight:"100px" }}>
                    {colOrds.map(order => (
                      <OrderCard key={order.id} order={order}
                        onClick={() => setSelectedId(order.id)}
                        onDragStart={() => setDragId(order.id)}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        isDragging={dragId === order.id}
                      />
                    ))}
                    {colOrds.length === 0 && (
                      <div className="h-20 rounded-lg border border-dashed border-border/50 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/35 font-mono">vazio</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 pt-4" style={{ scrollbarWidth:"none" }}>
          <GanttView orders={orders} onCardClick={o => setSelectedId(o.id)} />
          {/* Cancelled orders note */}
          {orders.filter(o => o.status === "cancelado").length > 0 && (
            <div className="mt-3 text-center text-[11px] font-mono text-muted-foreground/50">
              {orders.filter(o => o.status === "cancelado").length} pedido(s) cancelado(s) oculto(s) no Gantt
            </div>
          )}
        </div>
      )}

      <OrderDrawer order={selected} onClose={() => setSelectedId(null)} onStatusChange={changeStatus} />
    </div>
  );
}

/* ══ Agendamento ═════════════════════════════════════════════════ */

interface PrintJob {
  id: string; orderNum: string; client: string; initials: string; avatarColor: string;
  printerName: string; material: string; colorHex: string;
  start: Date; durationH: number; status: "scheduled" | "running" | "done";
}

const HOUR_H      = 56;
const SCHED_SH    = 7;
const SCHED_EH    = 23;
const SNAP_M      = 30;
const CAL_H       = (SCHED_EH - SCHED_SH) * HOUR_H;
const SCHED_PRNT  = ["Bambu X1C", "Prusa MK4", "Ender 3 Pro", "CR-10 S5", "Voron 2.4"];
const DAYS_PT     = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

const fmtHM  = (d: Date) => `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
const jobEnd  = (j: PrintJob) => new Date(j.start.getTime() + j.durationH * 3_600_000);
const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const hasConflict = (jobs: PrintJob[], job: PrintJob) =>
  jobs.some(j => j.id !== job.id && j.printerName === job.printerName && j.start < jobEnd(job) && jobEnd(j) > job.start);

const DY = (off: number, h: number, m = 0) => {
  const d = new Date(TODAY); d.setDate(d.getDate() + off); d.setHours(h, m, 0, 0); return d;
};

const SCHED_JOBS: PrintJob[] = [
  { id:"j1",  orderNum:"#050", client:"RoboLab UFMG",    initials:"RU", avatarColor:"#4f46e5", printerName:"Bambu X1C",   material:"PLA+", colorHex:"#3b82f6", start:DY( 0,  8,  0), durationH:6,   status:"running"   },
  { id:"j2",  orderNum:"#053", client:"Geek Store BH",   initials:"GB", avatarColor:"#be185d", printerName:"Prusa MK4",   material:"PETG", colorHex:"#10b981", start:DY( 0,  9, 30), durationH:5.5, status:"running"   },
  { id:"j3",  orderNum:"#047", client:"MakerShop SP",    initials:"MS", avatarColor:"#7c3aed", printerName:"Ender 3 Pro", material:"PLA",  colorHex:"#a78bfa", start:DY( 0, 13,  0), durationH:4,   status:"scheduled" },
  { id:"j4",  orderNum:"#054", client:"MakerShop SP",    initials:"MS", avatarColor:"#7c3aed", printerName:"CR-10 S5",    material:"ABS",  colorHex:"#f59e0b", start:DY( 0, 10,  0), durationH:8,   status:"running"   },
  { id:"j5",  orderNum:"#048", client:"Eletrotec Ltda",  initials:"EL", avatarColor:"#b45309", printerName:"Voron 2.4",   material:"ABS",  colorHex:"#ef4444", start:DY( 0, 14,  0), durationH:3,   status:"scheduled" },
  { id:"j6",  orderNum:"#051", client:"FabLab Curitiba", initials:"FC", avatarColor:"#0891b2", printerName:"Bambu X1C",   material:"PLA",  colorHex:"#06b6d4", start:DY( 1,  8,  0), durationH:7,   status:"scheduled" },
  { id:"j7",  orderNum:"#049", client:"Studio Pixel",    initials:"SP", avatarColor:"#0f766e", printerName:"Prusa MK4",   material:"PLA",  colorHex:"#f43f5e", start:DY( 1,  9,  0), durationH:4,   status:"scheduled" },
  { id:"j8",  orderNum:"#055", client:"Eletrotec Ltda",  initials:"EL", avatarColor:"#b45309", printerName:"CR-10 S5",    material:"ABS",  colorHex:"#f59e0b", start:DY( 1, 10,  0), durationH:10,  status:"scheduled" },
  { id:"j9",  orderNum:"#042", client:"Studio Noir",     initials:"SN", avatarColor:"#475569", printerName:"Ender 3 Pro", material:"PLA",  colorHex:"#94a3b8", start:DY( 1, 14,  0), durationH:3,   status:"scheduled" },
  { id:"j10", orderNum:"#048", client:"Eletrotec Ltda",  initials:"EL", avatarColor:"#b45309", printerName:"Voron 2.4",   material:"PETG", colorHex:"#06b6d4", start:DY( 2,  8,  0), durationH:6,   status:"scheduled" },
  { id:"j11", orderNum:"#053", client:"Geek Store BH",   initials:"GB", avatarColor:"#be185d", printerName:"Bambu X1C",   material:"PETG", colorHex:"#10b981", start:DY( 2,  9,  0), durationH:8,   status:"scheduled" },
  { id:"j12", orderNum:"#054", client:"MakerShop SP",    initials:"MS", avatarColor:"#7c3aed", printerName:"Prusa MK4",   material:"PLA+", colorHex:"#a78bfa", start:DY( 3, 10,  0), durationH:5,   status:"scheduled" },
  { id:"j13", orderNum:"#047", client:"MakerShop SP",    initials:"MS", avatarColor:"#7c3aed", printerName:"CR-10 S5",    material:"PLA",  colorHex:"#3b82f6", start:DY( 3,  8,  0), durationH:6,   status:"scheduled" },
  { id:"j14", orderNum:"#055", client:"Eletrotec Ltda",  initials:"EL", avatarColor:"#b45309", printerName:"Voron 2.4",   material:"ABS",  colorHex:"#ef4444", start:DY( 4,  9,  0), durationH:7,   status:"scheduled" },
  { id:"j15", orderNum:"#049", client:"Studio Pixel",    initials:"SP", avatarColor:"#0f766e", printerName:"Ender 3 Pro", material:"PLA",  colorHex:"#f43f5e", start:DY( 4,  8,  0), durationH:4,   status:"scheduled" },
];

function JobBlock({ job, top, height, isConflict, onDragStart, onClick }: {
  job: PrintJob; top: number; height: number; isConflict: boolean;
  onDragStart: (e: any) => void; onClick: () => void;
}) {
  const col = job.status === "running" ? "#06b6d4" : isConflict ? "#ef4444" : "#3b82f6";
  return (
    <div
      draggable onDragStart={onDragStart} onClick={onClick}
      style={{
        position:"absolute", left:2, right:2, top, height:Math.max(22, height),
        background:isConflict ? "rgba(239,68,68,0.18)" : `${col}18`,
        border:`1px solid ${col}55`, borderLeft:`3px solid ${col}`,
        borderRadius:6, overflow:"hidden", cursor:"grab", userSelect:"none", zIndex:10,
      }}
      className="hover:brightness-125 transition-all"
    >
      <div style={{ padding:"3px 6px" }}>
        <div className="text-[10px] font-bold font-mono leading-tight" style={{ color:col }}>
          {job.orderNum} · {fmtHM(job.start)}
        </div>
        {height > 34 && <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color:"rgba(255,255,255,0.8)" }}>{job.client}</div>}
        {height > 56 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:job.colorHex }} />
            <span className="text-[9px] font-mono truncate" style={{ color:"rgba(255,255,255,0.45)" }}>{job.material} · {job.durationH}h</span>
          </div>
        )}
        {isConflict && <div className="text-[8px] font-bold font-mono mt-1" style={{ color:"#ef4444" }}>⚠ CONFLITO</div>}
      </div>
    </div>
  );
}

function AgendamentoContent() {
  const [jobs,        setJobs]        = useState<PrintJob[]>(SCHED_JOBS);
  const [viewDate,    setViewDate]    = useState(() => new Date(TODAY));
  const [dragInfo,    setDragInfo]    = useState<{ id: string; offsetY: number } | null>(null);
  const [dropTgt,     setDropTgt]     = useState<{ printer: string; slotMin: number } | null>(null);
  const [focusPrnt,   setFocusPrnt]   = useState<string>("all");

  // Week strip
  const wkStart = new Date(viewDate);
  wkStart.setDate(viewDate.getDate() - ((viewDate.getDay() + 6) % 7));
  const weekDays = Array.from({ length:7 }, (_, i) => { const d = new Date(wkStart); d.setDate(wkStart.getDate() + i); return d; });

  // Day filter
  const dayEnd  = new Date(viewDate); dayEnd.setHours(23,59,59,999);
  const dayStart = new Date(viewDate); dayStart.setHours(0,0,0,0);
  const dayJobs  = jobs.filter(j => j.start <= dayEnd && jobEnd(j) >= dayStart);

  const visP = focusPrnt === "all" ? SCHED_PRNT : [focusPrnt];
  const hourLabels = Array.from({ length: SCHED_EH - SCHED_SH }, (_, i) => SCHED_SH + i);

  // Now line
  const nowTop = (() => {
    if (!sameDay(viewDate, TODAY)) return -1;
    const m = (TODAY.getHours() - SCHED_SH) * 60 + TODAY.getMinutes();
    return m < 0 ? -1 : (m / 60) * HOUR_H;
  })();

  // Drag handlers
  const onJobDragStart = (e: any, job: PrintJob) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragInfo({ id: job.id, offsetY: e.clientY - rect.top });
    e.dataTransfer.effectAllowed = "move";
  };

  const onColDragOver = (e: any, printer: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragInfo) return;
    const job = jobs.find(j => j.id === dragInfo.id);
    if (!job) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const rawM  = ((e.clientY - rect.top - dragInfo.offsetY) / HOUR_H) * 60;
    const snapM = Math.round(rawM / SNAP_M) * SNAP_M;
    const maxM  = (SCHED_EH - SCHED_SH - job.durationH) * 60;
    setDropTgt({ printer, slotMin: Math.max(0, Math.min(maxM, snapM)) });
  };

  const onColDrop = (e: any, printer: string) => {
    e.preventDefault();
    if (!dragInfo || !dropTgt) { setDragInfo(null); return; }
    const job = jobs.find(j => j.id === dragInfo.id);
    if (!job) return;
    const newStart = new Date(viewDate);
    newStart.setHours(SCHED_SH + Math.floor(dropTgt.slotMin / 60), dropTgt.slotMin % 60, 0, 0);
    const updated  = jobs.map(j => j.id === dragInfo.id ? { ...j, printerName: printer, start: newStart } : j);
    setJobs(updated);
    const moved = updated.find(j => j.id === dragInfo.id)!;
    if (hasConflict(updated, moved)) {
      toast.error("Conflito de agenda detectado", { description:`${printer} · ${fmtHM(newStart)}` });
    } else if (printer !== job.printerName) {
      toast.success(`Movido → ${printer}`, { description:`${job.orderNum} · ${fmtHM(newStart)}` });
    } else {
      toast.success(`Reagendado`, { description:`${job.orderNum} · ${fmtHM(newStart)} (${job.durationH}h)` });
    }
    setDragInfo(null); setDropTgt(null);
  };

  // Find free 2h slot
  const findSlot = () => {
    for (let day = 1; day <= 7; day++) {
      const d = new Date(TODAY); d.setDate(TODAY.getDate() + day);
      for (const printer of SCHED_PRNT) {
        for (let h = SCHED_SH; h <= SCHED_EH - 2; h++) {
          const s = new Date(d); s.setHours(h, 0, 0, 0);
          const e2 = new Date(s.getTime() + 2 * 3_600_000);
          const free = !jobs.filter(j => j.printerName === printer).some(j => j.start < e2 && jobEnd(j) > s);
          if (free) {
            toast.success("Slot disponível encontrado", {
              description:`${printer} · ${d.getDate()} ${MPT[d.getMonth()]} às ${h}:00`, duration:6000,
            });
            setViewDate(new Date(d));
            return;
          }
        }
      }
    }
    toast.error("Nenhum slot livre nos próximos 7 dias");
  };

  const conflictCount = jobs.filter(j => hasConflict(jobs, j)).length / 2;
  const totalRunning  = jobs.filter(j => j.status === "running").length;
  const totalSched    = jobs.filter(j => j.status === "scheduled").length;
  const utilPct       = (() => {
    const total = SCHED_PRNT.length * (SCHED_EH - SCHED_SH);
    const used  = dayJobs.reduce((s, j) => s + Math.min(j.durationH, SCHED_EH - SCHED_SH), 0);
    return Math.min(100, Math.round((used / total) * 100));
  })();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-semibold text-foreground">Agendamento de Impressoras</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25">Pro+</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {totalRunning} em execução · {totalSched} agendados
                {conflictCount > 0 && <span className="text-red-400 ml-1">· {conflictCount} conflito(s)</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={findSlot} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
              <Search className="w-3.5 h-3.5" /> Encontrar slot livre
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary rounded-lg text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Nova tarefa
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { val:`${utilPct}%`,                lbl:"Utilização hoje",   accent:utilPct>70?"#10b981":utilPct>40?"#f59e0b":"#6b7280" },
            { val:totalRunning.toString(),       lbl:"Em execução",       accent:"#06b6d4" },
            { val:totalSched.toString(),         lbl:"Agendados",         accent:"#3b82f6" },
            { val:conflictCount.toString(),      lbl:"Conflitos",         accent:conflictCount>0?"#ef4444":"#10b981" },
          ].map(({ val, lbl, accent }) => (
            <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
              <div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Week nav + printer filter */}
        <div className="flex items-center gap-1">
          <button onClick={() => setViewDate(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; })}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted/40 transition-colors text-muted-foreground flex-shrink-0"
          ><ChevronRight className="w-4 h-4 rotate-180" /></button>

          <div className="flex items-center gap-1 mx-1">
            {weekDays.map((d, i) => {
              const isV = sameDay(d, viewDate);
              const isT = sameDay(d, TODAY);
              const cnt = jobs.filter(j => sameDay(j.start, d)).length;
              return (
                <button key={i} onClick={() => setViewDate(new Date(d))}
                  className="flex flex-col items-center px-2.5 py-1 rounded-lg transition-all min-w-[40px]"
                  style={isV ? { background:"rgba(59,130,246,0.16)", color:"#3b82f6" } : { color:"#6b7280" }}
                >
                  <span className="text-[9px] font-mono uppercase leading-tight">{DAYS_PT[i]}</span>
                  <span className="text-[14px] font-display font-bold leading-tight" style={isT&&!isV?{color:"#3b82f6"}:{}}>{d.getDate()}</span>
                  <div className="flex gap-0.5 mt-0.5 h-1">
                    {cnt > 0 && Array.from({ length:Math.min(cnt, 5) }, (_, k) => (
                      <div key={k} className="w-1 h-1 rounded-full" style={{ background:isV?"#3b82f6":"rgba(255,255,255,0.2)" }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={() => setViewDate(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; })}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted/40 transition-colors text-muted-foreground flex-shrink-0"
          ><ChevronRight className="w-4 h-4" /></button>

          <div className="ml-auto flex items-center gap-1 flex-wrap">
            {["all", ...SCHED_PRNT].map(p => (
              <button key={p} onClick={() => setFocusPrnt(p)}
                className="px-2 py-1 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap"
                style={focusPrnt===p ? { background:"rgba(59,130,246,0.14)", color:"#3b82f6" } : { color:"#6b7280" }}
              >{p === "all" ? "Todas" : p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Printer column headers ── */}
      <div className="flex flex-shrink-0 border-b border-border bg-card/50">
        <div className="w-11 flex-shrink-0 border-r border-border" />
        {visP.map(printer => {
          const pJobs   = dayJobs.filter(j => j.printerName === printer);
          const running = pJobs.some(j => j.status === "running");
          const conflict = pJobs.some(j => hasConflict(jobs, j));
          return (
            <div key={printer} className="flex-1 px-3 py-2 border-r border-border min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0 border border-white/10" style={{ background:running?"#06b6d4":"#374151" }} />
                <span className="text-[11px] font-semibold text-foreground truncate">{printer}</span>
                {conflict && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 ml-auto" />}
              </div>
              <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                {pJobs.length} tarefa{pJobs.length !== 1 ? "s" : ""} hoje
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scrollable grid ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth:"thin" }}
        onDragEnd={() => { setDragInfo(null); setDropTgt(null); }}
      >
        <div className="flex" style={{ height: CAL_H }}>
          {/* Time axis */}
          <div className="w-11 flex-shrink-0 border-r border-border relative" style={{ height: CAL_H }}>
            {hourLabels.map(h => (
              <div key={h} style={{ position:"absolute", top:(h - SCHED_SH) * HOUR_H - 8, right:0, left:0 }}
                className="flex justify-end pr-2">
                <span className="text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.22)" }}>{h}:00</span>
              </div>
            ))}
          </div>

          {/* Printer columns */}
          {visP.map(printer => {
            const pJobs  = dayJobs.filter(j => j.printerName === printer);
            const isOver = dropTgt?.printer === printer;
            return (
              <div key={printer}
                className="flex-1 relative border-r border-border"
                style={{ height: CAL_H, minWidth:0, background:isOver ? "rgba(59,130,246,0.04)" : undefined }}
                onDragOver={e => onColDragOver(e, printer)}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTgt(null); }}
                onDrop={e => onColDrop(e, printer)}
              >
                {/* Grid lines */}
                {hourLabels.map(h => (
                  <div key={h} style={{ position:"absolute", left:0, right:0, top:(h - SCHED_SH) * HOUR_H, pointerEvents:"none" }}>
                    <div style={{ height:1, background:"rgba(255,255,255,0.055)" }} />
                    <div style={{ position:"absolute", top:HOUR_H / 2, left:0, right:0, height:1, background:"rgba(255,255,255,0.025)" }} />
                  </div>
                ))}

                {/* Now line */}
                {nowTop >= 0 && nowTop <= CAL_H && (
                  <div style={{ position:"absolute", top:nowTop, left:0, right:0, zIndex:20, pointerEvents:"none" }}>
                    <div style={{ height:2, background:"rgba(59,130,246,0.7)", boxShadow:"0 0 6px rgba(59,130,246,0.4)" }} />
                    <div style={{ position:"absolute", left:-1, top:-3, width:8, height:8, borderRadius:"50%", background:"#3b82f6" }} />
                  </div>
                )}

                {/* Drop ghost */}
                {isOver && dragInfo && (() => {
                  const job = jobs.find(j => j.id === dragInfo.id);
                  if (!job) return null;
                  return (
                    <div style={{
                      position:"absolute", left:2, right:2,
                      top:(dropTgt!.slotMin / 60) * HOUR_H,
                      height:job.durationH * HOUR_H,
                      background:"rgba(59,130,246,0.18)",
                      border:"1.5px dashed rgba(59,130,246,0.55)",
                      borderRadius:6, pointerEvents:"none", zIndex:5,
                    }} />
                  );
                })()}

                {/* Jobs */}
                {pJobs.map(job => {
                  const startMin = Math.max(0, (job.start.getHours() - SCHED_SH) * 60 + job.start.getMinutes());
                  const durMin   = Math.min(job.durationH * 60, (SCHED_EH - SCHED_SH) * 60 - startMin);
                  return (
                    <JobBlock key={job.id} job={job}
                      top={(startMin / 60) * HOUR_H}
                      height={(durMin / 60) * HOUR_H}
                      isConflict={hasConflict(jobs, job)}
                      onDragStart={e => onJobDragStart(e, job)}
                      onClick={() => toast.info(`${job.orderNum} · ${job.client}`, {
                        description:`${printer} · ${fmtHM(job.start)} → ${fmtHM(jobEnd(job))} · ${job.material} · ${job.durationH}h`
                      })}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ Relatórios e Análises ═══════════════════════════════════════ */

const RPT_MONTHS = [
  { m:"Set '25", PLA:1076, PLAB:838, PETG:883, ABS:614, TPU:346, outros:115, total:3872 },
  { m:"Out '25", PLA:1154, PLAB:898, PETG:953, ABS:661, TPU:373, outros:124, total:4163 },
  { m:"Nov '25", PLA:1114, PLAB:867, PETG:913, ABS:634, TPU:358, outros:119, total:4005 },
  { m:"Dez '25", PLA:1467, PLAB:1141,PETG:1204,ABS:835, TPU:471, outros:157, total:5275 },
  { m:"Jan '26", PLA:874,  PLAB:680, PETG:716, ABS:497, TPU:280, outros:93,  total:3140 },
  { m:"Fev '26", PLA:974,  PLAB:758, PETG:799, ABS:554, TPU:312, outros:104, total:3501 },
  { m:"Mar '26", PLA:1178, PLAB:916, PETG:967, ABS:671, TPU:378, outros:126, total:4236 },
  { m:"Abr '26", PLA:1282, PLAB:997, PETG:1052,ABS:730, TPU:411, outros:137, total:4609 },
  { m:"Mai '26", PLA:1369, PLAB:1065,PETG:1123,ABS:779, TPU:439, outros:146, total:4921 },
  { m:"Jun '26", PLA:1434, PLAB:1115,PETG:1177,ABS:816, TPU:460, outros:153, total:5155 },
  { m:"Jul '26", PLA:1383, PLAB:1075,PETG:1135,ABS:787, TPU:444, outros:148, total:4972 },
  { m:"Ago '26", PLA:1506, PLAB:1171,PETG:1235,ABS:857, TPU:483, outros:161, total:5413 },
];

const MAT_COSTS_D = [
  { name:"PETG",  custo:1820, pedidos:42, cor:MAT_COLOR["PETG"]  },
  { name:"PLA+",  custo:1560, pedidos:58, cor:MAT_COLOR["PLA+"]  },
  { name:"PLA",   custo:1240, pedidos:72, cor:MAT_COLOR["PLA"]   },
  { name:"ABS",   custo:940,  pedidos:31, cor:MAT_COLOR["ABS"]   },
  { name:"TPU",   custo:720,  pedidos:18, cor:MAT_COLOR["TPU"]   },
  { name:"ASA",   custo:380,  pedidos:9,  cor:MAT_COLOR["ASA"]   },
];

const TOP_MODELS_D = [
  { name:"Suporte de câmera",     cat:"Mecânico",    count:28, receita:2520, margin:54 },
  { name:"Engrenagem industrial", cat:"Mecânico",    count:22, receita:3080, margin:46 },
  { name:"Vaso decorativo v3",    cat:"Decorativo",  count:19, receita:1140, margin:61 },
  { name:"Garra robótica",        cat:"Mecânico",    count:16, receita:4800, margin:42 },
  { name:"Case Arduino Mega",     cat:"Funcional",   count:14, receita:980,  margin:57 },
  { name:"Miniatura arquitet.",   cat:"Arquitetura", count:11, receita:1650, margin:48 },
  { name:"Protótipo válvula",     cat:"Protótipo",   count:9,  receita:3150, margin:38 },
  { name:"Estatueta decorativa",  cat:"Arte",        count:8,  receita:880,  margin:65 },
];

const SCATTER_D = TOP_MODELS_D.map(m => ({
  x: m.count, y: m.margin, z: m.receita, name: m.name, cat: m.cat as ModelCat,
}));

const PRINTER_UTIL_D = [
  { name:"Bambu X1C",   used:21.4, idle:2.6  },
  { name:"Voron 2.4",   used:18.2, idle:5.8  },
  { name:"Prusa MK4",   used:16.5, idle:7.5  },
  { name:"CR-10 S5",    used:14.8, idle:9.2  },
  { name:"Ender 3 Pro", used:11.2, idle:12.8 },
];

const STOCK_HIST = [
  { m:"Mar '26", PLA:3200, PLAB:1800, PETG:2400, ABS:1600, TPU:900  },
  { m:"Abr '26", PLA:2800, PLAB:1520, PETG:2100, ABS:1380, TPU:780  },
  { m:"Mai '26", PLA:2300, PLAB:1200, PETG:1750, ABS:1100, TPU:640  },
  { m:"Jun '26", PLA:1900, PLAB:980,  PETG:1400, ABS:860,  TPU:520  },
  { m:"Jul '26", PLA:2600, PLAB:1750, PETG:2200, ABS:1500, TPU:800  },
  { m:"Ago '26", PLA:2200, PLAB:1460, PETG:1850, ABS:1280, TPU:660  },
];

const TIP_S = {
  contentStyle:{ background:"#0f1118", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, fontSize:11, fontFamily:"var(--font-mono)", padding:"8px 12px" },
  labelStyle:{ color:"#9ca3af", marginBottom:3 },
  itemStyle:{ color:"#e2e8f0" },
};
const AX_S = { fontSize:10, fontFamily:"var(--font-mono)", fill:"#6b7280" };
const AREA_KEYS: [string, string, string][] = [
  ["PLA","#3b82f6","PLA"], ["PLAB","#a78bfa","PLA+"], ["PETG","#10b981","PETG"],
  ["ABS","#f59e0b","ABS"], ["TPU","#06b6d4","TPU"],   ["outros","#6b7280","Outros"],
];
const LINE_KEYS: [string, string][] = [
  ["PLA","#3b82f6"], ["PLAB","#a78bfa"], ["PETG","#10b981"], ["ABS","#f59e0b"], ["TPU","#06b6d4"],
];

function ScatterTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const c = CAT_COLOR[d.cat as ModelCat];
  return (
    <div style={{ background:"#0f1118", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 12px", fontSize:11, fontFamily:"var(--font-mono)" }}>
      <div style={{ color:"#e2e8f0", fontWeight:600, marginBottom:3 }}>{d.name}</div>
      <div style={{ color:c }}>{d.cat}</div>
      <div style={{ color:"#9ca3af", marginTop:2 }}>{d.x} impressões · margem {d.y}%</div>
      <div style={{ color:"#9ca3af" }}>Receita acumulada: R$ {d.z.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, span }: {
  title: string; subtitle?: string; children: any; span?: number;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5${span === 2 ? " col-span-2" : ""}`}>
      <div className="mb-4">
        <div className="text-[13px] font-semibold text-foreground">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

type RptPeriod = "3m" | "6m" | "12m";

function RelatoriosContent() {
  const [period, setPeriod] = useState<RptPeriod>("6m");

  const mCnt = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const revData  = RPT_MONTHS.slice(-mCnt);
  const prevData = RPT_MONTHS.slice(-mCnt * 2, -mCnt);

  const totalRec  = revData.reduce((s, m) => s + m.total, 0);
  const prevRec   = prevData.reduce((s, m) => s + m.total, 0);
  const growth    = prevRec > 0 ? ((totalRec - prevRec) / prevRec * 100).toFixed(1) : null;
  const totalCusto = MAT_COSTS_D.reduce((s, m) => s + m.custo, 0);
  const totalPecas = TOP_MODELS_D.reduce((s, m) => s + m.count, 0);
  const avgMargin  = Math.round(TOP_MODELS_D.reduce((s, m) => s + m.margin, 0) / TOP_MODELS_D.length);

  const clientRevD = [...INIT_CLIENTS]
    .sort((a, b) => b.ltv - a.ltv).slice(0, 6)
    .map(c => ({ name:c.name.split(" ")[0], ltv:c.ltv, color:c.avatarColor, full:c.name }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Relatórios e Análises</h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Visão de desempenho do período selecionado</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-card border border-border rounded-lg overflow-hidden">
              {(["3m","6m","12m"] as RptPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 text-[11px] font-mono transition-all"
                  style={period===p ? { background:"rgba(59,130,246,0.15)", color:"#3b82f6" } : { color:"#6b7280" }}
                >{p === "3m" ? "3 meses" : p === "6m" ? "6 meses" : "12 meses"}</button>
              ))}
            </div>
            <button
              onClick={() => toast.info("Exportando relatório PDF…", { description:`Período: ${period}` })}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            ><FileText className="w-3.5 h-3.5" /> Exportar PDF</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { val:`R$ ${(totalRec/1000).toFixed(1)}k`,  lbl:"Receita total",         accent:"#10b981", sub:growth ? `+${growth}% vs período ant.` : undefined },
            { val:`R$ ${totalCusto.toLocaleString("pt-BR")}`, lbl:"Custo de materiais", accent:"#f59e0b" },
            { val:totalPecas.toString(),                  lbl:"Peças impressas",       accent:"#3b82f6" },
            { val:`${avgMargin}%`,                        lbl:"Margem média estimada", accent:"#a78bfa" },
          ].map(({ val, lbl, accent, sub }) => (
            <div key={lbl} className="rounded-xl border border-border bg-card px-4 py-3.5">
              <div className="font-display font-bold" style={{ fontSize:"22px", color:accent }}>{val}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lbl}</div>
              {sub && <div className="text-[9px] font-mono mt-0.5" style={{ color:accent }}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="flex-1 overflow-y-auto p-5 pt-4" style={{ scrollbarWidth:"thin" }}>
        <div className="grid grid-cols-2 gap-4">

          {/* 1. Revenue area — full width */}
          <ChartCard title="Receita por período" subtitle="Breakdown por tipo de material (R$)" span={2}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revData} margin={{ top:5, right:12, left:0, bottom:0 }}>
                <defs>
                  {AREA_KEYS.map(([k, c]) => (
                    <linearGradient key={k} id={`ag${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={c} stopOpacity={0}    />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="m" tick={AX_S} axisLine={false} tickLine={false} />
                <YAxis tick={AX_S} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                <Tooltip {...TIP_S} cursor={{ fill:"rgba(255,255,255,0.04)" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:"var(--font-mono)", paddingTop:8 }} />
                {AREA_KEYS.map(([k, c, label]) => (
                  <Area key={k} type="monotone" dataKey={k} name={label} stackId="1"
                    stroke={c} fill={`url(#ag${k})`} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. Material costs */}
          <ChartCard title="Custo de material por filamento" subtitle="Consumo total estimado no período (R$)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MAT_COSTS_D} layout="vertical" margin={{ top:0, right:24, left:4, bottom:0 }}>
                <XAxis type="number" tick={AX_S} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={AX_S} axisLine={false} tickLine={false} width={34} />
                <Tooltip {...TIP_S} cursor={{ fill:"rgba(255,255,255,0.04)" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Custo"]} />
                <Bar dataKey="custo" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {MAT_COSTS_D.map((m, i) => <Cell key={i} fill={m.cor} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3. Printer utilization */}
          <ChartCard title="Uso das impressoras" subtitle="Horas operacionais vs ociosas (semana atual)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={PRINTER_UTIL_D} layout="vertical" margin={{ top:0, right:24, left:4, bottom:0 }}>
                <XAxis type="number" tick={AX_S} axisLine={false} tickLine={false} domain={[0,24]} tickFormatter={v => `${v}h`} />
                <YAxis type="category" dataKey="name" tick={{ ...AX_S, fontSize:9 }} axisLine={false} tickLine={false} width={74} />
                <Tooltip {...TIP_S} cursor={{ fill:"rgba(255,255,255,0.04)" }}
                  formatter={(v: number, name: string) => [`${v}h`, name === "used" ? "Em uso" : "Ocioso"]} />
                <Bar dataKey="used" name="used" stackId="a" fill="#3b82f6" fillOpacity={0.85} maxBarSize={18} />
                <Bar dataKey="idle" name="idle" stackId="a" fill="rgba(255,255,255,0.07)" radius={[0,4,4,0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded" style={{ background:"#3b82f6" }} /><span className="text-[9px] font-mono text-muted-foreground">Em uso</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded" style={{ background:"rgba(255,255,255,0.12)" }} /><span className="text-[9px] font-mono text-muted-foreground">Ocioso</span></div>
            </div>
          </ChartCard>

          {/* 4. Top parts ranking */}
          <ChartCard title="Peças mais impressas" subtitle="Ranking por volume de impressões no período">
            <div className="space-y-2.5">
              {TOP_MODELS_D.slice(0, 7).map((m, i) => {
                const maxC = TOP_MODELS_D[0].count;
                const cc   = CAT_COLOR[m.cat as ModelCat];
                return (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-5 text-right text-[10px] font-mono font-bold flex-shrink-0" style={{ color:i < 3 ? "#f59e0b" : "#4b5563" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-foreground truncate mr-2">{m.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background:`${cc}18`, color:cc }}>{m.cat}</span>
                          <span className="text-[12px] font-display font-bold text-foreground">{m.count}×</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width:`${(m.count/maxC)*100}%`, background:cc }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* 5. Clients by revenue */}
          <ChartCard title="Clientes por receita" subtitle="Lifetime value acumulado (R$)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clientRevD} layout="vertical" margin={{ top:0, right:24, left:4, bottom:0 }}>
                <XAxis type="number" tick={AX_S} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                <YAxis type="category" dataKey="name" tick={AX_S} axisLine={false} tickLine={false} width={60} />
                <Tooltip {...TIP_S} cursor={{ fill:"rgba(255,255,255,0.04)" }}
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Lifetime value"]}
                  labelFormatter={(label: string) => clientRevD.find(c => c.name === label)?.full ?? label}
                />
                <Bar dataKey="ltv" radius={[0,4,4,0]} maxBarSize={20}>
                  {clientRevD.map((c, i) => <Cell key={i} fill={c.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 6. Margin scatter */}
          <ChartCard title="Margem por produto" subtitle="Volume de impressões × margem % · tamanho = receita acumulada">
            <ResponsiveContainer width="100%" height={210}>
              <ScatterChart margin={{ top:10, right:20, left:0, bottom:18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" tick={AX_S} axisLine={false} tickLine={false}
                  label={{ value:"Impressões", position:"insideBottom", offset:-8, style:{ ...AX_S, fill:"#4b5563" } }} />
                <YAxis type="number" dataKey="y" tick={AX_S} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <ZAxis type="number" dataKey="z" range={[50, 420]} />
                <Tooltip content={<ScatterTip />} />
                <Scatter data={SCATTER_D}>
                  {SCATTER_D.map((d, i) => (
                    <Cell key={i} fill={CAT_COLOR[d.cat]} fillOpacity={0.8} stroke={CAT_COLOR[d.cat]} strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-1">
              {(Object.entries(CAT_COLOR) as [ModelCat, string][]).map(([cat, c]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background:c }} />
                  <span className="text-[9px] font-mono text-muted-foreground">{cat}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* 7. Stock over time — full width */}
          <ChartCard title="Estoque ao longo do tempo" subtitle="Histórico de filamento disponível em gramas por tipo" span={2}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={STOCK_HIST} margin={{ top:5, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="m" tick={AX_S} axisLine={false} tickLine={false} />
                <YAxis tick={AX_S} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}kg`} />
                <Tooltip {...TIP_S} cursor={{ stroke:"rgba(255,255,255,0.12)", strokeWidth:1 }} formatter={(v: number) => [`${v}g`, ""]} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:"var(--font-mono)", paddingTop:8 }} />
                {LINE_KEYS.map(([k, c]) => (
                  <Line key={k} type="monotone" dataKey={k} name={k === "PLAB" ? "PLA+" : k}
                    stroke={c} strokeWidth={2} dot={false} activeDot={{ r:4, fill:c, strokeWidth:0 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>
    </div>
  );
}

/* ══ Calculadora de Custo ════════════════════════════════════════ */

function CalcTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-2xl">
      <div className="text-[11px] font-mono font-bold" style={{ color:d.color }}>{d.name}</div>
      <div className="text-[14px] font-display font-bold text-foreground">R$ {d.value.toFixed(2)}</div>
      <div className="text-[10px] font-mono text-muted-foreground">{d.pct.toFixed(1)}% do preço</div>
    </div>
  );
}

function CalculadoraContent() {
  const [selMat,     setSelMat]     = useState("PLA");
  const [useCustom,  setUseCustom]  = useState(false);
  const [customCpg,  setCustomCpg]  = useState("");
  const [hours,      setHours]      = useState("3");
  const [mins,       setMins]       = useState("20");
  const [cph,        setCph]        = useState("3.80");
  const [selPrinter, setSelPrinter] = useState<string | null>(null);
  const [paintCost,  setPaintCost]  = useState("0");
  const [sandCost,   setSandCost]   = useState("0");
  const [otherCost,  setOtherCost]  = useState("0");
  const [margin,     setMargin]     = useState(35);
  const [overhead,   setOverhead]   = useState(12);
  const [materialRows, setMaterialRows] = useState<Array<{ id: string; type: "Filamento" | "Caixa" | "LED" | "Resina"; materialId: string; quantity: string }>>([
    { id:"row-1", type:"Filamento", materialId: INIT_FILAMENTS[0]?.id ?? "custom", quantity:"85" },
  ]);

  const materialCatalog = [
    ...INIT_FILAMENTS.map(f => ({
      id: f.id,
      type: "Filamento" as const,
      category: "Filamento",
      label: `${f.material} · ${f.brand} · ${f.color}`,
      unit: "g",
      unitCost: f.costPerKg / 1000,
      color: MAT_COLOR[f.material] ?? "#3b82f6",
    })),
    { id:"box-generic", type:"Caixa" as const, category:"Caixa", label:"Caixa · Embalagem padrão", unit:"uni", unitCost:0.18, color:"#a78bfa" },
    { id:"led-generic", type:"LED" as const, category:"LED", label:"LED · Fita LED", unit:"m", unitCost:0.12, color:"#f59e0b" },
    { id:"resina-generic", type:"Resina" as const, category:"Resina", label:"Resina · Padrão", unit:"ml", unitCost:0.16, color:"#f97316" },
  ];

  const getMaterialOption = (id: string) => materialCatalog.find(item => item.id === id) ?? materialCatalog[0];
  const matAvgCpg = (() => {
    const acc: Record<string, number[]> = {};
    INIT_FILAMENTS.forEach(f => {
      if (!acc[f.material]) acc[f.material] = [];
      acc[f.material].push(f.costPerKg / 1000);
    });
    return Object.fromEntries(
      Object.entries(acc).map(([k, vs]) => [k, vs.reduce((a, b) => a + b, 0) / vs.length])
    );
  })();

  const addMaterialRow = () => {
    setMaterialRows(prev => [...prev, { id:`row-${Date.now()}-${Math.random()}`, type:"Filamento", materialId: materialCatalog[0].id, quantity:"50" }]);
  };

  const removeMaterialRow = (id: string) => {
    setMaterialRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : prev);
  };

  const updateMaterialRow = (id: string, changes: Partial<{ type: "Filamento" | "Caixa" | "LED" | "Resina"; materialId: string; quantity: string }>) => {
    setMaterialRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, ...changes };
      const available = materialCatalog.filter(item => item.type === updated.type);
      if (!available.some(item => item.id === updated.materialId)) {
        updated.materialId = available[0]?.id ?? materialCatalog[0].id;
      }
      return updated;
    }));
  };

  const materialCostTotal = materialRows.reduce((total, row) => {
    const option = getMaterialOption(row.materialId);
    const qty = parseFloat(row.quantity) || 0;
    const effectiveUnitCost = useCustom ? (parseFloat(customCpg) || 0) : option.unitCost;
    return total + qty * effectiveUnitCost;
  }, 0);

  /* ── Live calculations ── */
  const cpg         = useCustom ? (parseFloat(customCpg) || 0) : (matAvgCpg[selMat] ?? 0.089);
  const printH      = (parseFloat(hours) || 0) + (parseFloat(mins) || 0) / 60;
  const cphN        = parseFloat(cph) || 0;
  const paintN      = parseFloat(paintCost) || 0;
  const sandN       = parseFloat(sandCost) || 0;
  const otherN      = parseFloat(otherCost) || 0;

  const matCost     = materialCostTotal;
  const machineCost = printH * cphN;
  const postCost    = paintN + sandN + otherN;
  const subtotal    = matCost + machineCost + postCost;
  const ovhAmt      = subtotal * (overhead / 100);
  const breakeven   = subtotal + ovhAmt;
  const sellPrice   = margin >= 100 ? breakeven * 100 : breakeven / (1 - margin / 100);
  const profitAmt   = sellPrice - breakeven;
  const safePct     = (v: number) => sellPrice > 0 ? (v / sellPrice) * 100 : 0;

  const pieData = [
    { name:"Material",     value:matCost,    color:"#3b82f6", pct:safePct(matCost)     },
    { name:"Máquina",      value:machineCost, color:"#10b981", pct:safePct(machineCost) },
    { name:"Pós-processo", value:postCost,   color:"#f59e0b", pct:safePct(postCost)    },
    { name:"Overhead",     value:ovhAmt,     color:"#6b7280", pct:safePct(ovhAmt)      },
    { name:"Lucro",        value:profitAmt,  color:"#a78bfa", pct:safePct(profitAmt)   },
  ].filter(d => d.value > 0.001);

  const marginColor = margin >= 50 ? "#10b981" : margin >= 30 ? "#f59e0b" : "#ef4444";
  const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const totalQty = materialRows.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
  const handleSave = () => toast.success("Modelo salvo no catálogo", {
    description:`${materialRows.length} material${materialRows.length > 1 ? "is" : ""} · ${totalQty} unidade${totalQty === 1 ? "" : "s"} · ${fmtBRL(sellPrice)}`, duration:3000 });
  const handleOrder = () => toast.success("Adicionado ao pedido", {
    description:`Preço unitário: ${fmtBRL(sellPrice)}`, duration:3000 });

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground font-mono focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ─── LEFT: Inputs ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto p-5 space-y-4 border-r border-border" style={{ scrollbarWidth:"none", maxWidth:"530px" }}>
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Calculadora de Custo de Peça</h2>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Insira os dados do seu slicer para precificar com exatidão</p>
        </div>

        {/* ── 1. Material ── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono font-bold text-foreground uppercase tracking-[0.08em]">Materiais da peça</div>
            <button onClick={() => setUseCustom(u => !u)}
              className="text-[10px] font-mono px-2 py-1 rounded transition-all"
              style={useCustom ? { background:"rgba(59,130,246,0.15)", color:"#3b82f6" } : { color:"#6b7280" }}
            >{useCustom ? "← usar catálogo" : "custo manual"}</button>
          </div>

          {useCustom && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] block mb-1.5">Custo por unidade/grama (R$)</label>
              <input type="number" value={customCpg} onChange={e => setCustomCpg(e.target.value)} placeholder="ex: 0.089" className={inputCls} />
            </div>
          )}

          <div className="space-y-3">
            {materialRows.map((row, index) => {
              const option = getMaterialOption(row.materialId);
              const rowQty = parseFloat(row.quantity) || 0;
              const rowCost = useCustom ? rowQty * (parseFloat(customCpg) || 0) : rowQty * option.unitCost;
              const typeOptions = ["Filamento", "Caixa", "LED", "Resina"] as const;
              const availableOptions = materialCatalog.filter(item => item.type === row.type);

              return (
                <div key={row.id} className="rounded-lg border border-border bg-background/60 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.08em]">Material {index + 1}</div>
                    {materialRows.length > 1 && (
                      <button onClick={() => removeMaterialRow(row.id)} className="text-[10px] font-mono text-muted-foreground hover:text-foreground">Remover</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={row.type}
                      onChange={e => updateMaterialRow(row.id, { type: e.target.value as typeof row.type })}
                      className={inputCls}
                    >
                      {typeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <select
                      value={row.materialId}
                      onChange={e => updateMaterialRow(row.id, { materialId: e.target.value })}
                      className={inputCls}
                    >
                      {availableOptions.map(item => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] block mb-1.5">Quantidade</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={e => updateMaterialRow(row.id, { quantity: e.target.value })}
                        placeholder={option.unit === "g" ? "85" : option.unit === "m" ? "2" : option.unit === "ml" ? "40" : "1"}
                        className={`${inputCls} pr-10`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">{option.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{option.category}</span>
                    <span style={{ color: option.color }}>{rowCost > 0 ? `R$ ${rowCost.toFixed(2)}` : `R$ 0,00`}</span>
                  </div>
                </div>
              );
            })}

            <button onClick={addMaterialRow} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-[12px] font-medium text-foreground hover:bg-muted/30 transition-colors">
              <Plus className="w-4 h-4" /> Adicionar material
            </button>
          </div>

          <div className="flex items-end">
            <div className="w-full px-3 py-2.5 rounded-lg bg-background border border-border">
              <div className="text-[10px] font-mono text-muted-foreground">Custo total dos materiais</div>
              <div className="text-[16px] font-display font-bold text-foreground mt-0.5" style={{ color:"#3b82f6" }}>R$ {matCost.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* ── 2. Impressão ── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-[11px] font-mono font-bold text-foreground uppercase tracking-[0.08em]">Impressão</div>
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] mb-2">Impressora (opcional — preenche custo/h)</div>
            <div className="flex flex-wrap gap-1.5">
              {PRINTERS.filter(p => p.status === "ativa").map(p => (
                <button key={p.id}
                  onClick={() => { const same = selPrinter === p.id; setSelPrinter(same ? null : p.id); if (!same) setCph(p.cph.toFixed(2)); }}
                  className="px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all"
                  style={selPrinter===p.id
                    ? { borderColor:"#3b82f6", background:"rgba(59,130,246,0.1)", color:"#3b82f6" }
                    : { borderColor:"rgba(255,255,255,0.07)", color:"#6b7280" }}
                >
                  {p.name} <span className="opacity-50">R${p.cph}/h</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] block mb-1.5">Horas</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0" placeholder="3" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] block mb-1.5">Minutos</label>
              <input type="number" value={mins} onChange={e => setMins(e.target.value)} min="0" max="59" placeholder="20" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] block mb-1.5">Custo/hora (R$)</label>
              <input type="number" value={cph} onChange={e => setCph(e.target.value)} placeholder="3.80" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] font-mono text-muted-foreground">
              {printH > 0 ? `${printH.toFixed(2)}h de impressão` : ""}
            </div>
            <div className="px-3 py-2 rounded-lg bg-background border border-border">
              <div className="text-[10px] font-mono text-muted-foreground">Custo máquina</div>
              <div className="text-[14px] font-display font-bold" style={{ color:"#10b981" }}>R$ {machineCost.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* ── 3. Pós-processamento ── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-[11px] font-mono font-bold text-foreground uppercase tracking-[0.08em]">Pós-Processamento</div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label:"Pintura (R$)",   val:paintCost, set:setPaintCost },
              { label:"Lixamento (R$)", val:sandCost,  set:setSandCost  },
              { label:"Outros (R$)",    val:otherCost, set:setOtherCost },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em] block mb-1.5">{label}</label>
                <input type="number" value={val} onChange={e => set(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
            ))}
          </div>
          {postCost > 0 && (
            <div className="flex justify-end pt-1">
              <div className="px-3 py-2 rounded-lg bg-background border border-border">
                <div className="text-[10px] font-mono text-muted-foreground">Total pós-processo</div>
                <div className="text-[14px] font-display font-bold" style={{ color:"#f59e0b" }}>R$ {postCost.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Estratégia de preço ── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-5">
          <div className="text-[11px] font-mono font-bold text-foreground uppercase tracking-[0.08em]">Estratégia de Preço</div>
          {/* Margin */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Margem de lucro desejada</div>
              <div className="text-[18px] font-display font-bold" style={{ color:marginColor }}>{margin}%</div>
            </div>
            <input type="range" min={5} max={85} step={1} value={margin} onChange={e => setMargin(+e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background:`linear-gradient(to right, #3b82f6 ${(margin-5)/80*100}%, rgba(255,255,255,0.1) ${(margin-5)/80*100}%)` }}
            />
            <div className="flex gap-1.5 mt-3">
              {[{ label:"Mínimo", val:20 },{ label:"Padrão", val:35 },{ label:"Premium", val:55 }].map(p => (
                <button key={p.label} onClick={() => setMargin(p.val)}
                  className="flex-1 py-1.5 rounded-md text-[10px] font-mono transition-all"
                  style={margin===p.val
                    ? { background:"rgba(59,130,246,0.15)", color:"#3b82f6" }
                    : { background:"rgba(255,255,255,0.04)", color:"#6b7280" }}
                >{p.label} ({p.val}%)</button>
              ))}
            </div>
          </div>
          {/* Overhead */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.08em]">Impostos & Overhead</div>
              <div className="text-[18px] font-display font-bold text-foreground">{overhead}%</div>
            </div>
            <input type="range" min={0} max={40} step={1} value={overhead} onChange={e => setOverhead(+e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background:`linear-gradient(to right, #6b7280 ${overhead/40*100}%, rgba(255,255,255,0.1) ${overhead/40*100}%)` }}
            />
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground/40 mt-1.5">
              <span>0% (sem overhead)</span><span>40% (máximo)</span>
            </div>
          </div>
        </div>
        <div className="h-2" />
      </div>

      {/* ─── RIGHT: Live output ────────────────────────────────── */}
      <div className="w-[370px] flex-shrink-0 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth:"none" }}>

        {/* Sell price hero */}
        <div className="rounded-xl border border-border bg-card p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% -10%, rgba(167,139,250,0.18) 0%, transparent 65%)" }} />
          <div className="relative">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.12em] mb-3">Preço de Venda Sugerido</div>
            <div className="font-display font-bold leading-none" style={{ fontSize:"46px", color:"#a78bfa", textShadow:"0 0 48px rgba(167,139,250,0.45)" }}>
              {fmtBRL(sellPrice)}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="text-[11px] font-mono text-muted-foreground">
                Breakeven: <span className="text-foreground font-semibold">{fmtBRL(breakeven)}</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="text-[11px] font-mono" style={{ color:profitAmt > 0 ? "#10b981" : "#ef4444" }}>
                Lucro: {fmtBRL(profitAmt)}
              </div>
            </div>
            {breakeven > 0 && (
              <div className="mt-2 text-[10px] font-mono text-muted-foreground/60">
                {((sellPrice / breakeven - 1) * 100).toFixed(1)}% acima do ponto de equilíbrio
              </div>
            )}
          </div>
        </div>

        {/* Pie chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[11px] font-mono font-semibold text-foreground mb-4">Decomposição do preço de venda</div>
          {sellPrice > 0 ? (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={64} outerRadius={96}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                      animationBegin={0}
                      animationDuration={400}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CalcTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.08em]">venda</div>
                    <div className="font-display font-bold text-foreground" style={{ fontSize:"16px" }}>
                      {fmtBRL(sellPrice)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2 mt-3 pt-3 border-t border-border">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background:d.color }} />
                    <div className="flex-1 text-[12px] text-foreground">{d.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">R$ {d.value.toFixed(2)}</div>
                    <div className="text-[11px] font-mono w-10 text-right font-semibold" style={{ color:d.color }}>{d.pct.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <Calculator className="w-8 h-8 text-muted-foreground/20" />
              <div className="text-[12px] font-mono text-muted-foreground/50">Preencha os campos para ver a análise</div>
            </div>
          )}
        </div>

        {/* Breakdown table */}
        {breakeven > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] mb-3">Análise de rentabilidade</div>
            <div className="space-y-3">
              {[
                { lbl:"Custo direto",    val:subtotal,    desc:`mat. + máquina + pós-proc.`,   accent:"" },
                { lbl:"Overhead",        val:ovhAmt,      desc:`${overhead}% sobre custo direto`,  accent:"#6b7280" },
                { lbl:"Breakeven",       val:breakeven,   desc:"preço mínimo sem lucro",        accent:"#f59e0b" },
                { lbl:"Lucro bruto",     val:profitAmt,   desc:`${margin}% da venda`,           accent:"#10b981" },
                { lbl:"Preço de venda",  val:sellPrice,   desc:"valor sugerido ao cliente",     accent:"#a78bfa" },
              ].map(({ lbl, val, desc, accent }) => (
                <div key={lbl} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-medium" style={{ color:accent||"#d4d8e8" }}>{lbl}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/60">{desc}</div>
                  </div>
                  <div className="text-[13px] font-mono font-semibold text-foreground flex-shrink-0" style={{ color:accent||"#d4d8e8" }}>
                    R$ {val.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={handleSave} disabled={sellPrice <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-all disabled:opacity-25"
            style={{ background:"rgba(167,139,250,0.14)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.28)" }}
          >
            <CheckCircle className="w-4 h-4" /> Salvar como modelo no catálogo
          </button>
          <button onClick={handleOrder} disabled={sellPrice <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-all disabled:opacity-25"
          >
            <ShoppingCart className="w-4 h-4" /> Adicionar ao pedido
          </button>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}

/* ══ App shell ═══════════════════════════════════════════════════ */

export default function App() {
  const [activeNav, setNav]       = useState("Dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const visibleAlerts = ALERTS_D.filter(a => !dismissed.has(a.id));
  return (
    <>
      <Toaster position="bottom-right" theme="dark" richColors />
      <style>{`
        @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn     { from { opacity: 0; }                 to { opacity: 1; }               }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: 2px solid #090b10; }
        input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: 2px solid #090b10; }
      `}</style>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-[216px] flex-shrink-0 flex flex-col bg-card border-r border-border">
          <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0"><Printer className="w-4 h-4 text-primary-foreground" /></div>
            <span className="font-display text-[17px] font-bold tracking-widest text-foreground">Drip3D</span>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {NAV_ITEMS.map(({ label, Icon }) => (
              <button key={label} onClick={() => setNav(label)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${activeNav===label?"bg-primary/15 text-primary font-medium":"text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">MF</div>
              <div className="min-w-0"><div className="text-[12px] font-medium text-foreground truncate">Marcos Ferreira</div><div className="text-[11px] text-muted-foreground font-mono">Administrador</div></div>
            </div>
          </div>
        </aside>
        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
            <div>
              <h1 className="text-[14px] font-semibold text-foreground">{activeNav === "Dashboard" ? "Dashboard Principal" : activeNav}</h1>
              <p className="text-[11px] text-muted-foreground font-mono">Sex, 15 Ago 2026 · 14:32</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  className="relative w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                  style={notifOpen ? { background:"rgba(59,130,246,0.12)" } : {}}
                >
                  <Bell className="w-4 h-4" style={{ color: notifOpen ? "#3b82f6" : "#9ca3af" }} />
                  {visibleAlerts.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-white px-0.5">
                      {visibleAlerts.length}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl shadow-black/50 overflow-hidden" style={{ animation:"fadeIn 120ms ease" }}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="text-[12px] font-semibold text-foreground">Notificações</span>
                        {visibleAlerts.length > 0 && (
                          <button
                            onClick={() => setDismissed(new Set(ALERTS_D.map(a => a.id)))}
                            className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                          >Limpar todas</button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth:"none" }}>
                        {visibleAlerts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <CheckCircle className="w-6 h-6 text-muted-foreground/30" />
                            <span className="text-[11px] font-mono text-muted-foreground/50">Nenhuma notificação</span>
                          </div>
                        ) : visibleAlerts.map(a => (
                          <div key={a.id} className={`flex items-start gap-2.5 px-4 py-3 border-b border-border/50 text-[11px] ${a.sev==="critical"?"text-red-300":a.sev==="warning"?"text-amber-300":"text-blue-300"}`}>
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span className="flex-1 leading-relaxed">{a.text}</span>
                            <button
                              onClick={() => setDismissed(s => new Set([...s, a.id]))}
                              className="opacity-30 hover:opacity-70 transition-opacity flex-shrink-0 mt-0.5"
                            ><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"><Settings className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </header>
          {activeNav === "Dashboard"   && <DashboardContent />}
          {activeNav === "Impressoras" && <ImpressorasContent />}
          {activeNav === "Materiais"   && <MateriaisContent />}
          {activeNav === "Catálogo"    && <CatalogoContent />}
          {activeNav === "Calculadora" && <CalculadoraContent />}
          {activeNav === "Pedidos"     && <PedidosContent />}
          {activeNav === "Clientes"    && <ClientesContent />}
          {activeNav === "Relatórios"  && <RelatoriosContent />}
          {!['Dashboard','Impressoras','Materiais','Catálogo','Calculadora','Pedidos','Clientes','Relatórios'].includes(activeNav) && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display font-bold text-muted-foreground/15 mb-2" style={{ fontSize:"48px" }}>{activeNav}</div>
                <p className="text-[12px] text-muted-foreground font-mono">Módulo em desenvolvimento</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
