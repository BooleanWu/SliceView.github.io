/**
 * The main handler for drag'n'drop and also for file selection. The XTK scene
 * gets created here and the viewer gets activated. Inspired by
 * http://imgscalr.com - THANKS!!
 */
//detail

jQuery(document).ready(function() {


  detect_viewingmode();

  initBrowserWarning();
  initDnD();

  ren3d = null;
  configurator = function() {

  };

  // from http://stackoverflow.com/a/7826782/1183453
  var args = document.location.search.substring(1).split('&');
  argsParsed = {};
  for (var i=0; i < args.length; i++)
  {
      arg = unescape(args[i]);

      if (arg.length == 0) {
        continue;
      }

      if (arg.indexOf('=') == -1)
      {
          argsParsed[arg.replace(new RegExp('/$'),'').trim()] = true;
      }
      else
      {
          kvp = arg.split('=');
          argsParsed[kvp[0].trim()] = kvp[1].replace(new RegExp('/$'),'').trim();
      }
  }

  // setup logging hotkey
  $(window).keypress(function(e) {
    if (e.charCode == 108) {
      $('#log').show();
      _LOG_ = true;
    }
  });

  if ('14yrold' in argsParsed) {

    load14yrold();

  } else if ('scene' in argsParsed) {

    // we have a scene
    var _scene = document.location.href.split('=');
    _scene.shift(); // remove first part 

    _scene = _scene.join('=');

    console.log('Found scene ' + _scene);
    loadScene(_scene);

  } else if ('url' in argsParsed) {

    console.log('Found url ' + argsParsed['url']);

  } else {

    //for (var a in argsParsed) {
    var _url = document.location.search;
    if (_url.length > 1) {
      loadFile(document.location.search.substring(1));
    }
    //}

  }

  function switch_orientation(id) {

    var _width = jQuery(id).width();
    var _height = jQuery(id).height();

    // now convert to percentage
    console.log('old', _width, _height);
    _width = jQuery(id).width() / jQuery(document).width() * 100;
    _height = jQuery(id).height() / jQuery(document).height() * 100;
    console.log('new', _width, _height);
    jQuery(id).height(_width + '%');
    jQuery(id).width(_height + '%');
    jQuery(id).css('position', 'absolute');

  }

  function detect_viewingmode() {

    // portrait or landscape display
    if (jQuery(document).width() < jQuery(document).height()) {

      jQuery(document.body).removeClass('landscape');
      jQuery(document.body).addClass('portrait');

    } else {

      jQuery(document.body).removeClass('portrait');
      jQuery(document.body).addClass('landscape');

    }

  }

  // add a handler for viewing mode detecting
  jQuery(window).resize(detect_viewingmode);

});

var _current_3d_content = null;
var _current_Ax_content = null;
var _current_Sag_content = null;
var _current_Cor_content = null;


function showLarge(el2, new3d_content) {

  // jump out if the renderers were not set up
  if (!_current_3d_content || !_current_Ax_content || !_current_Sag_content ||
      !_current_Cor_content) {

    console.log('nothing to do');

    return;

  }

  // from Stackoverflow http://stackoverflow.com/a/6391857/1183453

  var el1 = jQuery('#3d');
  el1.prepend('<span/>'); // drop a marker in place
  var tag1 = jQuery(el1.children()[0]);
  var old_content = tag1.nextAll();

  tag1.replaceWith(el2.children('div, canvas'));

  el2.prepend('<span/>');
  var tag2 = jQuery(el2.children()[0]);
  tag2.replaceWith(old_content);

  // adjust the XTK containers

  var _2dcontainerId = el2.attr('id');
  var _orientation = _2dcontainerId.replace("slice","");

  if (_orientation == 'ren3d') {
    return;
  }

  var _old_2d_content = eval('_current_' + _orientation + '_content');
  var _old_3d_content = _current_3d_content;

  _current_3d_content.container = document.getElementById(_2dcontainerId);
  _old_2d_content.container = document.getElementById('3d');

  // .. and update the layout
  _current_3d_content = _old_2d_content;
  eval('_current_' + _orientation + '_content = _old_3d_content');

  // fire resize event
  var evt = document.createEvent('UIEvents');
  evt.initUIEvent('resize', true, false, window, 0);
  window.dispatchEvent(evt);

};



function initBrowserWarning() {

  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (!isChrome && !isFirefox) {
    jQuery("#browser-warning").fadeIn(125);
  }
};

// Drop File init

function initDnD() {

  // Add drag handling to target elements
  document.getElementById("body").addEventListener("dragenter", onDragEnter,
      false);

  // Add drag leve and over EventListener
  document.getElementById("drop-box-overlay").addEventListener("dragleave",
      onDragLeave, false);
  document.getElementById("drop-box-overlay").addEventListener("dragover",
      noopHandler, false);

  // Add drop handling
  document.getElementById("drop-box-overlay").addEventListener("drop", onDrop,
      false);
};

function noopHandler(evt) {

  // 由于drop是针对全局的，该方法将停止事件的传播，阻止它被分派到其他 Document 节点
  evt.stopPropagation();
  
  // 阻止打开链接
  evt.preventDefault();
};

function onDragEnter(evt) {

  jQuery("#drop-box-overlay").fadeIn(125);
  //jQuery("#drop-box-prompt").fadeIn(125);
};

function onDragLeave(evt) {

  /*
   * We have to double-check the 'leave' event state because this event stupidly
   * gets fired by JavaScript when you mouse over the child of a parent element;
   * instead of firing a subsequent enter event for the child, JavaScript first
   * fires a LEAVE event for the parent then an ENTER event for the child even
   * though the mouse is still technically inside the parent bounds.
   */
  if (evt.pageX < 10 || evt.pageY < 10 ||
      jQuery(window).width() - evt.pageX < 10 ||
      jQuery(window).height - evt.pageY < 10) {
    jQuery("#drop-box-overlay").fadeOut(125);
    //jQuery("#drop-box-prompt").fadeOut(125);
  }
};

function onDrop(evt) {

  // Consume the event.
  noopHandler(evt);

  // Hide overlay
  jQuery("#drop-box-overlay").fadeOut(0);
  //jQuery("#drop-box-prompt").fadeOut(0);

  // Get the dropped files.
  var files = evt.dataTransfer.files;

  // If anything is wrong with the dropped files, exit.
  if (typeof files == "undefined" || files.length == 0) {
    return;
  }

  selectfiles(files);

};

// show viewerBody and hide frontpage
function switchToViewer() {

  jQuery('#body').addClass('viewerBody');
  jQuery('#frontpage').hide();
  jQuery('#viewer').show();

};

function selectfiles(files) {

  // now switch to the viewer
  switchToViewer();

  // .. and start the file reading
  read(files);

};

