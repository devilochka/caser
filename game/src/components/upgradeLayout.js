// The early shell and the interactive page use the same responsive structure.
export function arrangeUpgradeLayout(el) {
  if (!matchMedia('(max-width:1024px)').matches) return;
  const by = id => el.querySelector(`[data-testid="${id}"]`);
  const layout = document.createElement('div');
  layout.className = 'upgrade-mobile-layout';
  const choices = document.createElement('div');
  choices.className = 'upgrade-mobile-choices';
  choices.append(by('upgrade-user-items-card'), by('upgrade-desired-card'));
  layout.append(
    by('upgrade-sound-toolbar'), by('upgrade-center-block'), choices,
    by('upgrade-add-balance-slider-desktop').parentElement.parentElement,
    by('upgrade-fast-amounts-block'), by('upgrade-user-block'), by('upgrade-desired-block'),
  );
  el.replaceChildren(layout);
  layout.querySelectorAll('[class]').forEach(node => node.classList.remove('lg:hidden'));
}
