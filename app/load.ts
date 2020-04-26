import { clearMap, setNewMapData } from './state';
import { decodeMap } from './save';
import { template } from './template';
import steg from './vendors/steganography';
import LZString from 'lz-string';
import { showLoadingScreen } from "./ui/loadingScreen";

function clickElem(elem) {
  // Thx user1601638 on Stack Overflow (6/6/2018 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file )
  const eventMouse = document.createEvent('MouseEvents');
  eventMouse.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,
  );
  elem.dispatchEvent(eventMouse);
}

export function loadTemplate() {
  clearMap();
  setNewMapData(decodeMap(template));
}

export function tryLoadAutosaveMap() {
  document.cookie = '';
  if (localStorage) {
    const autosave = localStorage.getItem('autosave');
    if (autosave !== null) {
      clearMap();
      setNewMapData(decodeMap(JSON.parse(autosave)));
      return true;
    }
  }
  return false;
}

export function loadMapFromFile() {
  loadImage((image) => {
    const mapJSONString = steg.decode(image.src, {
      height: image.height,
      width: image.width,
    });
    clearMap();

    let json;
    try {
      json = JSON.parse(mapJSONString);
    } catch (err) {
      try {
        json = JSON.parse(LZString.decompressFromUTF16(mapJSONString))
      } catch (e) {
        json = JSON.parse(LZString.decompress(mapJSONString))
      }
    }
    const map = decodeMap(json);

    setNewMapData(map);
  });
}

export function loadImage(onLoad) {
  const readFile = function (eventRead) {
    const file = eventRead.target.files[0];
    if (!file) {
      return;
    }
    if (file.type == "image/heic") { // convert to png
      // this takes a long time, so show loading screen
      showLoadingScreen(true);
      import("heic2any").then(heic2anyModule => {
        const heic2any = heic2anyModule.default;
        heic2any({blob: file })
          .then(function(conversionResult) {
            showLoadingScreen(false);
            var url = URL.createObjectURL(conversionResult);
            loadDataURLAsImage(url);
          })
          .catch(function(e) {
            showLoadingScreen(false);
            console.error(e);
          });
      });
    } else {
      blobToDataURL(file, loadDataURLAsImage);
    }

    function loadDataURLAsImage (dataURL) {
      var image = new Image();
      image.src = dataURL;
      image.addEventListener('load', function() {onLoad(image)}, false);
    }
  }
  loadFile(readFile);
}

export function loadFile(onLoad) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';
  fileInput.onchange = onLoad;
  clickElem(fileInput);
}

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

function blobToDataURL(blob, callback) {
  var a = new FileReader();
  a.onload = function(e) {callback(e.target?.result);}
  a.readAsDataURL(blob);
}
