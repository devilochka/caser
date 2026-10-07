import { defaultProfile, getRating } from '../services/profileIdentity.js';
async function avatarData(file) {
  if(!/^image\/(png|jpeg|webp|gif|avif|bmp)$/.test(file.type))throw Error('Выбери картинку PNG, JPG, WebP или GIF');
  if(file.size>10*1024*1024)throw Error('Картинка должна быть меньше 10 МБ');
  const bitmap=await createImageBitmap(file);
  try {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d'),side=Math.min(bitmap.width,bitmap.height);
    ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);
    return canvas.toDataURL('image/webp',.85);
  } finally { bitmap.close(); }
}
export function mountProfileSettings(body,app) {
  const profile={...defaultProfile(),...app.store.state.profile};
  const original=document.querySelector('[data-testid="profile-user-card"] img.object-cover')?.dataset.originalAvatar
    || document.querySelector('[data-testid^="header-profile-link"] img')?.dataset.originalAvatar;
  const form=document.createElement('form');form.id='settings-profile-form';form.className='caser-profile-settings';
  form.innerHTML='<h3>Мой профиль</h3><div class="profile-settings-avatar"><img id="settings-avatar-preview" alt="Аватар"><div><label class="profile-avatar-upload" for="settings-avatar-file">Выбрать аватарку</label><input id="settings-avatar-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp"><button type="button" id="settings-avatar-reset">Стандартная аватарка</button></div></div><label for="settings-profile-nickname">Ник</label><input id="settings-profile-nickname" maxlength="32" autocomplete="off" required><label for="settings-profile-id">ID</label><input id="settings-profile-id" maxlength="20" inputmode="numeric" autocomplete="off" required><p class="profile-settings-rating"></p><button type="submit" class="caser-admin-deposit">Сохранить профиль</button><p id="settings-profile-status" role="status" aria-live="polite"></p>';
  body.append(form);
  const nickname=form.querySelector('#settings-profile-nickname'),id=form.querySelector('#settings-profile-id'),preview=form.querySelector('#settings-avatar-preview'),status=form.querySelector('#settings-profile-status'),file=form.querySelector('#settings-avatar-file');
  nickname.value=profile.nickname;id.value=profile.id;let avatar=profile.avatar,loading=false,revision=0;
  preview.src=avatar||original||'./src/avatar.svg';
  form.querySelector('.profile-settings-rating').textContent=`Caser Rating: ${getRating(app.store.state).toLocaleString('en-US')}. +1 за каждые 100 DEMO пополнений и ставок; обновляется сразу.`;
  file.onchange=async()=>{
    const selected=file.files[0];if(!selected)return;
    const current=++revision;loading=true;status.textContent='Загрузка аватарки…';
    try{const data=await avatarData(selected);if(current!==revision)return;avatar=data;preview.src=data;status.textContent='Аватарка выбрана. Нажми «Сохранить профиль»';}
    catch(error){if(current===revision)status.textContent=error.message;}
    finally{if(current===revision)loading=false;}
  };
  form.querySelector('#settings-avatar-reset').onclick=()=>{revision++;loading=false;avatar='';file.value='';preview.src=original||'./src/avatar.svg';status.textContent='Нажми «Сохранить профиль»';};
  form.onsubmit=event=>{
    event.preventDefault();
    try{
      if(loading)throw Error('Дождись загрузки аватарки');
      const name=nickname.value.trim(),userId=id.value.trim();
      if(!name||name.length>32)throw Error('Ник должен содержать от 1 до 32 символов');
      if(!/^\d{1,20}$/.test(userId))throw Error('ID должен содержать от 1 до 20 цифр');
      app.store.commit(s=>{s.profile={nickname:name,id:userId,avatar};});
      app.updateBalance();status.textContent='Профиль сохранён';
    }catch(error){status.textContent=error.message;}
  };
}
