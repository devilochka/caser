export const defaultProfile = () => ({ id: '357440', nickname: 'kenzo', avatar: '' });
export const ratingLevels = [
  ['GREY',0,'#B8C6D4','#586571'],['LIGHT BLUE',5000,'#92BFE1','#345B79'],
  ['BLUE',10000,'#7180F5','#343878'],['PURPLE',15000,'#BD61F0','#572273'],
  ['PINK',20000,'#E700ED','#730671'],['RED',25000,'#FF484C','#781919'],['GOLD',30000,'#FFD800','#776000'],
].map(([name,min,color,bg])=>({name,min,color,bg}));
const positive = value => Math.max(0, Number(value) || 0);
export function backfillActivity(state) {
  return { deposits: 0, turnover:
    state.openingHistory.reduce((sum,h)=>sum+positive(h.cost),0)
    + state.upgradeHistory.reduce((sum,h)=>sum+positive(h.effectiveInputValue ?? h.stake ?? h.input?.price),0) };
}
// Local progression: one point per 100 DEMO credits deposited or staked.
// Sales, rewards and editing the admin balance do not count.
export function getRating(state) {
  const activity = state.activity || backfillActivity(state);
  return Math.min(35000, Math.floor((positive(activity.turnover)+positive(activity.deposits))/100));
}
export function applyProfile(state) {
  const profile = {...defaultProfile(),...state.profile};
  for(const node of document.querySelectorAll('[data-testid="profile-user-card-nickname"]')) node.textContent=profile.nickname;
  for(const node of document.querySelectorAll('[data-testid^="profile-user-card-id-"]')) node.textContent='ID:'+profile.id;
  for(const img of document.querySelectorAll('[data-testid^="header-profile-link"] img,[data-testid="profile-user-card"] img.object-cover')) {
    img.dataset.originalAvatar ||= img.getAttribute('src');
    const src=profile.avatar || img.dataset.originalAvatar;
    if(img.getAttribute('src')!==src) img.src=src;
    img.alt=profile.nickname;
  }
  const value=getRating(state),level=ratingLevels.findLast(level=>value>=level.min);
  for(const node of document.querySelectorAll('.profile-settings-rating')) node.textContent=`Caser Rating: ${value.toLocaleString('en-US')}. +1 за каждые 100 DEMO пополнений и ставок; обновляется сразу.`;
  for(const bar of document.querySelectorAll('[data-testid="rating-bar"]')) {
    bar.dataset.rating=String(value);bar.dataset.ratingGroup=level.name;
    bar.title=`Caser Rating: ${value.toLocaleString('en-US')} · ${level.name}`;
    bar.setAttribute('aria-label',bar.title);
    const parts=bar.querySelectorAll('span[style*="font-size"]'),formatted=value.toString().padStart(4,'0');
    if(parts[0])parts[0].textContent=formatted.slice(0,-3);
    if(parts[1])parts[1].textContent=','+formatted.slice(-3);
    for(const span of parts)span.style.color=level.color;
    for(const path of bar.querySelectorAll('svg path'))path.setAttribute('fill',level.color);
    const background=[...bar.querySelectorAll('[style*="linear-gradient"]')].find(node=>!node.style.background.includes('rgba(0, 0, 0'));
    if(background)background.style.background=`linear-gradient(90deg,${level.bg}cc,${level.bg}ee)`;
  }
}
