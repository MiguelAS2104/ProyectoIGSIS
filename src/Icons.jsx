const paths = {
 box: 'M21 8 12 3 3 8l9 5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5',
 bag: 'M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2',
 cart: 'M2 3h3l3 13h10l3-9H6M9 20h.01M18 20h.01',
 chart: 'M4 3v17h17M8 16v-5M13 16V7M18 16V4',
 bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
 settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
 history: 'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v6l4 2',
 search: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5',
 user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a8 8 0 0 1 16 0v2',
 plus: 'M12 5v14M5 12h14',
 eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 edit: 'm15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5Z',
 clipboard: 'M9 4H6v17h12V4h-3M9 2h6v5H9V2ZM9 12h6M9 16h4',
 check: 'm5 12 4 4L19 6',
 close: 'm6 6 12 12M6 18 18 6',
 download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
 save: 'M4 3h13l4 4v14H3V3h1ZM7 3v6h9V3M7 21v-8h10v8',
 filter: 'M4 7h16M7 12h10M10 17h4',
 arrow: 'M4 12h16m-6-6 6 6-6 6',
 shirt: 'm8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z',
 dress: 'M9 3H7l2 7-4 11h14l-4-11 2-7h-2a3 3 0 0 1-6 0ZM9 10h6',
 pants: 'M6 3h12l2 18h-6l-2-12-2 12H4L6 3ZM6 7h12M12 3v6',
 skirt: 'M8 3h8l5 18H3L8 3ZM7 7h10M10 10l-2 8M14 10l2 8',
 truck: 'M3 5h12v12H3V5ZM15 9h4l3 5v3h-7M7 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 money: 'M3 5h18v14H3V5ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM6 12h.01M18 12h.01',
};
export function Icon({name='box',size=16}){return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.box}/></svg>}
export function ProductIcon({product,size=36}){const name=({Vestidos:'dress',Pantalones:'pants',Faldas:'skirt'})[product.category]||'shirt';return <span className={`product-art product-art-${name}`} style={{width:size,height:size}}><Icon name={name} size={Math.round(size*.65)}/></span>}
export function StatusBadge({value}){const tone=({'Disponible':'sage','Confirmada':'sage','Aprobada':'sage','Recibida':'sage','Stock bajo':'peach','Pendiente':'peach','Agotado':'rose','Anulada':'rose','Rechazada':'rose','Exceso':'lavender'})[value]||'lavender';return <span className={`status-badge ${tone}`}><i/>{value}</span>}

