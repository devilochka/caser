const levels = [
  ['GREY','0,000 – 4,999','4',',999','#B8C6D4','#586571'],
  ['LIGHT BLUE','5,000 – 9,999','9',',999','#92BFE1','#345B79'],
  ['BLUE','10,000 – 14,999','14',',999','#7180F5','#343878'],
  ['PURPLE','15,000 – 19,999','19',',999','#BD61F0','#572273'],
  ['PINK','20,000 – 24,999','24',',999','#E700ED','#730671'],
  ['RED','25,000 – 29,999','29',',999','#FF484C','#781919'],
  ['GOLD','30,000 – 35,000','35',',000','#FFD800','#776000'],
];
export function openRatingDialog() {
  document.querySelector('#caser-rating-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'caser-rating-dialog';
  dialog.setAttribute('aria-labelledby','rating-dialog-title');
  dialog.innerHTML = `<header><h2 id="rating-dialog-title">CASER RATING</h2><button type="button" data-rating-close aria-label="Закрыть"><svg viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20"/></svg></button></header>
    <section class="rating-dialog-content"><p>Caser Rating — числовой показатель уровня вашего аккаунта. Он растёт сразу после пополнений, открытий кейсов и апгрейдов: 1 балл за каждые 100 DEMO. Чем крупнее ваши пополнения и ставки, тем выше рейтинг и группа.</p><p>Рейтинг не влияет на награды или привилегии — он лишь показывает ваш текущий уровень.</p>
    <div class="rating-levels">${levels.map(([name,range,number,fraction,color,bg])=>`<div class="rating-level" style="--rating-color:${color};--rating-bg:${bg}"><span class="rating-level-name">${name}</span><span class="rating-level-range">${range}</span><div class="rating-level-badge"><svg viewBox="0 0 112 36" aria-hidden="true"><path d="M24 0H112L106 36H18Z" fill="${bg}"/><g fill="${color}"><path d="M16 0H24L18 36H10L16 0Z M6 0H14L8 36H0L6 0Z"/><path d="M26.668 32H20.668L25.334 4H31.334L26.668 32Z" opacity=".15"/><path d="M34.668 32H28.668L33.334 4H39.334L34.668 32Z M46.668 32H36.668L41.334 4H51.334L46.668 32Z" opacity=".08"/></g></svg><span><b>${number}</b><small>${fraction}</small></span></div></div>`).join('')}</div></section>
    <footer><button type="button" data-rating-close>ЗАКРЫТЬ</button></footer>`;
  for (const button of dialog.querySelectorAll('[data-rating-close]')) button.onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.append(dialog);
  dialog.showModal();
}
