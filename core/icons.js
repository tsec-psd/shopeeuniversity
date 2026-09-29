/* Classic script; load after xd-core.js. UI icons contain inline paths only. */
(function(XD){
  var icons = {
  'arrow-left':'M19 12H5|M12 19l-7-7 7-7',
  'undo':'M9 14 4 9l5-5|M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  'redo':'M15 14l5-5-5-5|M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  'sliders':'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  'swatch':'M3 3h8v8H3z|M13 3h8v8h-8z|M3 13h8v8H3z|M13 13h8v8h-8z',
  'folder-open':'M4 20h14a2 2 0 0 0 1.9-1.37L22 12H8a2 2 0 0 0-1.9 1.37L4 20z|M4 20V6a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v2',
  'save':'M12 3v12|M7 11l5 5 5-5|M4 20h16',
  'sheet':'M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z|M14 2v5h5|M8 13h8M8 17h8M11 13v4',
  'image':'M3 5h18v14H3z|M3 16l5-5 4 4 3-3 6 6|M8.5 8.5a1.2 1.2 0 1 0 .01 0',
  'layers':'M12 2 2 7l10 5 10-5-10-5z|M2 17l10 5 10-5M2 12l10 5 10-5',
  'package':'M21 8 12 3 3 8v8l9 5 9-5V8z|M3 8l9 5 9-5|M12 13v10',
  'file-up':'M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z|M14 2v5h5|M12 18v-6|M9 15l3-3 3 3',
  'folder-up':'M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z|M12 17v-6|M9.5 13.5 12 11l2.5 2.5',
  'help':'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M9.1 9.2a3 3 0 0 1 5.8 1c0 2-2.9 2.8-2.9 2.8|M12 17.2h.01',
  'trash':'M3 6h18|M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6|M10 11v6M14 11v6',
  'plus':'M12 5v14M5 12h14',
  'pencil':'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
  'arrow-up':'M12 19V5|M5 12l7-7 7 7',
  'alert':'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z|M12 9v4|M12 17h.01',
  'more':'M5 12h.01M12 12h.01M19 12h.01',
  'grid':'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  'frame':'M4 8V4h4|M16 4h4v4|M20 16v4h-4|M8 20H4v-4',
  'zoom':'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z|M21 21l-4.3-4.3',
  'check':'M20 6 9 17l-5-5',
  'close':'M18 6 6 18M6 6l12 12',
  'table':'M3 4h18v16H3z|M3 9h18M9 9v11'
};
  XD.icon = function(name, opts){
    if (!Object.prototype.hasOwnProperty.call(icons,name)) return '';
    var size = opts && Number(opts.size) || 16;
    if (!Number.isFinite(size) || size <= 0) size = 16;
    return '<svg aria-hidden="true" focusable="false" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+icons[name].split('|').map(function(d){return '<path d="'+d+'"/>';}).join('')+'</svg>';
  };
  XD.iconify = function(root){
    (root || document).querySelectorAll('[data-icon]').forEach(function(el){ el.innerHTML = XD.icon(el.dataset.icon); });
  };
})(window.XD);
