/* Classic script: icons.js must be loaded first. Shared chrome only. */
(function(){
  function init(){
    XD.iconify(document);
    var menus = Array.from(document.querySelectorAll('.ui-menu'));
    function close(menu, focus){
      var button = menu.querySelector('.ui-menu-toggle');
      menu.querySelector('.ui-popup').hidden = true;
      button.setAttribute('aria-expanded','false');
      if (focus) button.focus();
    }
    function position(menu){
      var button = menu.querySelector('.ui-menu-toggle'), popup = menu.querySelector('.ui-popup');
      var r = button.getBoundingClientRect();
      popup.style.left = Math.max(8, Math.min(r.right-popup.offsetWidth, innerWidth-popup.offsetWidth-8))+'px';
      popup.style.top = Math.min(r.bottom+6, innerHeight-popup.offsetHeight-8)+'px';
    }
    menus.forEach(function(menu){
      var button = menu.querySelector('.ui-menu-toggle'), popup = menu.querySelector('.ui-popup');
      popup.querySelectorAll('label.btn').forEach(function(label){
        label.tabIndex = 0;
        label.addEventListener('keydown',function(e){
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); label.querySelector('input').click(); }
        });
      });
      button.addEventListener('click',function(){
        var open = popup.hidden;
        menus.forEach(function(other){close(other,false);});
        popup.hidden = !open;
        button.setAttribute('aria-expanded',String(open));
        if(open) position(menu);
      });
      menu.addEventListener('keydown',function(e){
        if(e.key === 'Escape'){close(menu,true);return;}
        if(e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        if(popup.hidden) button.click();
        var items = Array.from(popup.querySelectorAll('button:not(:disabled),a,label.btn'));
        var n = items.indexOf(document.activeElement), delta = e.key === 'ArrowDown' ? 1 : -1;
        if(items.length) items[(n+delta+items.length)%items.length].focus();
      });
      popup.addEventListener('click',function(e){
        if(e.target.closest('button,a,input')) close(menu,false);
      });
    });
    document.addEventListener('pointerdown',function(e){menus.forEach(function(menu){if(!menu.contains(e.target))close(menu,false);});});
    document.addEventListener('focusin',function(e){menus.forEach(function(menu){if(!menu.contains(e.target))close(menu,false);});});
    addEventListener('resize',function(){menus.forEach(function(menu){if(!menu.querySelector('.ui-popup').hidden)position(menu);});});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
