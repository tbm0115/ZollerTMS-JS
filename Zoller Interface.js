// |**********************************************************************;
// * Project           : Zoller Web Service Object Library
// *
// * Program name      : Zoller Interface.js
// *
// * Author            : Trais McAllister (tbm0115@gmail.com; http://stackexchange.com/users/5815241/tbm0115
// *
// * Date created      : 04-12-2016
// *
// * Purpose           : Provides a series of JavaScript objects based on the objects available in the Zoller TMS Web Service.
// *
// * Comment Font			 : http://patorjk.com/software/taag/#p=display&v=0&c=c%2B%2B&f=Cybermedium&t=Type%20Something
// * Comment Block		 : http://server:8086/Comment%20Block%20Generator.html
// *
// |**********************************************************************;

// **************************************************************************
// *****************************Global Variables*****************************
//
// Notes:
//     graphicSuffixes: A list of potential suffixes regarding the 
//     GraphicGroup and GraphicFile nodes in the raw XML 
//     structure.
//     
//     _imageLargePreviewSize:
//     An object specifying the preference for the rendering size for a 
//     large image.
//     
//     _imageMediumPreviewSize:
//     An object specifying the preference for the rendering size for a 
//     medium image.
//     
//     _imageSmallPreviewSize:
//     An object specifying the preference for the rendering size for a 
//     small image. 
//
// **************************************************************************

var graphicSuffixes = ["", "1", "2", "3", "4", "5", "6", "7", "8"]; // Graphic suffixes
var _imageLargePreviewSize = { width: 150, height: 150 };
var _imageMediumPreviewSize = { width: 75, height: 75 };
var _imageSmallPreviewSize = { width: 50, height: 50 };


// **************************************************************************
// ***************************Web Service Objects***************************
//
// Notes:
//     These objects accept either the raw XML from the Zoller Web Service 
//     or the Zoller TMS id of the object. If the id is provided, then an 
//     XMLHttpRequest is sent to retrieve the raw xml from the Zoller Web 
//     Service. The raw XML is used to fill the properties of the object. 
//
// **************************************************************************

function ZollerAdapter(id) {
  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    console.log("Received XML: ", this.XML);
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeAdapter;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Adapter/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
	nodeAdapter = getNodeByTagName(this.XML, "Adapter");

  this.AdapterId = getValue(nodeAdapter, "AdapterId");
  this.Name = getValue(nodeAdapter, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.Type = getValue(nodeAdapter, "AdapterType");

  this.Images = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeAdapter.children.length, n = 0; n < len; n++) {
    console.log("Main Tag Name: ", nodeAdapter.children[n].tagName);
    // Iterate through the main nodes first as there are more nodes than suffixes
    if (nodeAdapter.children[n].tagName == "AdapterPresetter") {
      for (var blen = nodeAdapter.children[n].children.length, k = 0; k < blen; k++) {
        for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
          // Iterate through the possible suffixes to see if the current node matches
          if (nodeAdapter.children[n].children[k].tagName == "GraphicFile" + graphicSuffixes[i]) {
            this.Images.push(new ZollerGraphicImage(nodeAdapter.children[n].children[k].innerHTML, nodeAdapter.children[n].children[k + 1].innerHTML));
          }
        }
      }
    }
  }

}

function ZollerMachine(id) {
  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    console.log("Received XML: ", this.XML);
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeMachine;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Machine/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
	nodeMachine = getNodeByTagName(this.XML, "Machine");


  this.MachineId = getValue(nodeMachine, "MachineId");// Grabbing the global value is okay because it only returns the first instance of the object
  this.Name = getValue(nodeMachine, "Name");
  this.Description = getValue(nodeMachine, "Description");
  this.MagazineCapacity = getValue(nodeMachine, "NoOfMagazinPositions");
  this.NCToDirectory = getValue(nodeMachine, "NcProgrammTransferPath");
  this.NCFromDirectory = getValue(nodeMachine, "NcProgrammTransferBackPath");
  this.MachineType = getValue(nodeMachine, "Type");
  this.Manufacturer = getValue(nodeMachine, "Manufacturer");

  this.Images = [];
  this.Tools = [];
  this.SettingSheets = [];
  this.Accessories = [];
  this.Adapters = [];
  this.Documents = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeMachine.children.length, n = 0; n < len; n++) {
    console.log("Main Tag Name: ", nodeMachine.children[n].tagName);
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeMachine.children[n].tagName == "GraphicFile" + graphicSuffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeMachine.children[n].innerHTML, nodeMachine.children[n + 1].innerHTML));
      }
    }
    // Get Components and Tools of the Machine
    if (nodeMachine.children[n].tagName == "MachineToolList") {
      console.log("Found ToolList Data");
      var cmpnts = getNodes(nodeMachine.children[n], "Tool");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Tools.push(new ZollerTool(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No tools found in ToolList Data");
      }
    }
    // Get SettingSheets of the Machine
    if (nodeMachine.children[n].tagName == "SettingSheetList") {
      console.log("Found SettingSheet Data");
      var cmpnts = getNodes(nodeMachine.children[n], "SettingSheet");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.SettingSheets.push(new ZollerSettingSheet(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No settingsheets found in SettingSheet Data");
      }
    }
    // Get Documents of the Machine
    if (nodeMachine.children[n].tagName == "ExternalDocument") {
      console.log("Found Document Data");
      var cmpnts = getNodes(nodeMachine.children[n], "Document");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No documents found in ExternalDocument Data");
      }
    }
    // Get Accessories of the Machine
    if (nodeMachine.children[n].tagName == "MachineAccessoryList") {
      console.log("Found Accessory Data");
      var cmpnts = getNodes(nodeMachine.children[n], "Accessory");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No accessories found in Accessory Data");
      }
    }
    // Get Adapters of the Machine
    if (nodeMachine.children[n].tagName == "MachineAdapterList") {
      console.log("Found Adapter Data");
      var cmpnts = getNodes(nodeMachine.children[n], "Adapter");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Adapters.push(new ZollerAdapter(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No accessories found in Adapter Data");
      }
    }
  }
}

function ZollerSettingSheet(id) {
  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    console.log("Received XML: ", this.XML);
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeSettingSheet;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "SettingSheet/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
	nodeSettingSheet = getNodeByTagName(this.XML, "SettingSheet");

  this.SettingSheetId = getValue(nodeSettingSheet, "SettingSheetId");
  this.Name = getValue(nodeSettingSheet, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.WorkStep = getValue(nodeSettingSheet, "WorkStep");

  this.Images = [];
  this.Tools = [];
  this.Documents = [];
  this.Machine;

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeSettingSheet.children.length, n = 0; n < len; n++) {
    console.log("Main Tag Name: ", nodeSettingSheet.children[n].tagName);
    // Get Machine of the SettingSheet
    if (nodeSettingSheet.children[n].tagName == "Machine") {
      console.log("Found Machine Data");
      this.Machine = new ZollerMachine(nodeSettingSheet.children[n]);
    }
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeSettingSheet.children[n].tagName == "GraphicFile" + graphicSuffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeSettingSheet.children[n].innerHTML, nodeSettingSheet.children[n + 1].innerHTML));
      }
    }
    // Get Components and Tools of the SettingSheet
    if (nodeSettingSheet.children[n].tagName == "ToolList") {
      console.log("Found ToolList Data");
      var cmpnts = getNodes(nodeSettingSheet.children[n], "Tool");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Tools.push(new ZollerTool(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No tools found in ToolList Data");
      }
    }
    // Get Documents of the Tool
    if (nodeSettingSheet.children[n].tagName == "ExternalDocument") {
      console.log("Found Document Data");
      var cmpnts = getNodes(nodeSettingSheet.children[n], "Document");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No documents found in ExternalDocument Data");
      }
    }
  }

  this.DrawHTML = function (parent) {
    var tmpHTML = new HTMLSettingSheet(this);
    parent.innerHTML = tmpHTML.GetMarkup();
  }
}

function ZollerTool(id) {
  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    console.log("Received XML: ", this.XML);
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeTool;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Tool/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
	nodeTool = getNodeByTagName(this.XML, "Tool");

  this.ToolId = getValue(nodeTool, "ToolId");
  this.Description = getValue(nodeTool, "Description");// Grabbing the global value is okay because it only returns the first instance of the object

  this.CharacteristicStructures = [];
  this.Images = [];
  this.SingleComponents = [];
  this.Accessories = [];
  this.Documents = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeTool.children.length, n = 0; n < len; n++) {
    console.log("Main Tag Name: ", nodeTool.children[n].tagName);
    if (nodeTool.children[n].tagName == "Characteristic") {
      this.CharacteristicStructures.push(new ZollerCharacteristicStructure(nodeTool.children[n]));
    }
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeTool.children[n].tagName == "GraphicFile" + graphicSuffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeTool.children[n].innerHTML, nodeTool.children[n + 1].innerHTML));
      }
    }
    // Get Components and Accessories of the Tool
    if (nodeTool.children[n].tagName == "Article") {
      console.log("Found Article Data");
      var cmpnts = getNodes(nodeTool.children[n], "Component");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.SingleComponents.push(new ZollerSingleComponent(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No components found in Article Data");
      }
      cmpnts = getNodes(nodeTool.children[n], "Accessory");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No accessories found in Article Data");
      }
    }
    // Get Documents of the Tool
    if (nodeTool.children[n].tagName == "ExternalDocument") {
      console.log("Found Document Data");
      var cmpnts = getNodes(nodeTool.children[n], "Document");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No documents found in ExternalDocument Data");
      }
    }
  }

  // Get the most pertinent SVG data if available.
  this.SVG = getValue(nodeTool, "ScalableVectorGraphic");

  this.DrawHTML = function (parent) {
    var tmpHTML = new HTMLTool(this);
    parent.innerHTML = tmpHTML.GetMarkup();
  }
}

function ZollerSingleComponent(id) {
  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    console.log("Received XML: ", this.XML);
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeComponent;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Component/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
	nodeComponent = getNodeByTagName(this.XML, "SingleComponent");

  this.ComponentId = getValue(nodeComponent, "ComponentId");

  this.Description = getValue(nodeComponent, "Description");

  this.CharacteristicStructures = [];
  this.Images = [];
  this.Accessories = [];
  this.Documents = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeComponent.children.length, n = 0; n < len; n++) {
    if (nodeComponent.children[n].tagName == "Characteristic") {
      this.CharacteristicStructures.push(new ZollerCharacteristicStructure(nodeComponent.children[n]));
    }
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeComponent.children[n].tagName == "GraphicFile" + graphicSuffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeComponent.children[n].innerHTML, nodeComponent.children[n + 1].innerHTML));
      }
    }
    // Get Accessories of the Tool
    if (nodeComponent.children[n].tagName == "Article") {
      console.log("Found Article Data");
      var cmpnts = getNodes(nodeComponent.children[n], "Accessory");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No accessories found in Article Data");
      }
    }
    // Get Documents of the Tool
    if (nodeComponent.children[n].tagName == "ExternalDocument") {
      console.log("Found Document Data");
      var cmpnts = getNodes(nodeComponent.children[n], "Document");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No documents found in ExternalDocument Data");
      }
    }
  }

  // Get the most pertinent SVG data if available.
  this.SVG = getValue(nodeComponent, "ScalableVectorGraphic");

  this.DrawHTML = function (parent) {
    var tmpHTML = new HTMLSingleComponent(this);
    parent.innerHTML = tmpHTML.GetMarkup();
  }
  this.GetPreview = function () {
    var out = "<div class='preview singleComponent'>";
    if (this.Images.length > 0) {
      out += "<a target='_blank' href='" + this.Images[0].ImageURL + "'>" + this.Images[0].Image.outerHTML + "</a>";
    } else {
      out += "<span class='graphic'>No Preview</span>";
    }
    out += "<span class='componentId'>" + this.ComponentId + "</span>";
    out += "<span class='description'>" + this.Description + "</span></div>";
    return out;
  }
}

function ZollerAccessory(id) {
  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    console.log("Received XML: ", this.XML);
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeAccessory;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Accessory/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
	nodeAccessory = getNodeByTagName(this.XML, "Accessory");

  this.AccessoryId = getValue(nodeAccessory, "AccessoryId");

  this.Description = getValue(nodeAccessory, "Description");

}

// **************************************************************************
// **********************Zoller Characteristics Objects**********************
//
// Notes:
//     These objects are used to hold the structure for the Zoller TMS 
//     Article Characteristic Bar styles. All Article Characteristic style 
//     should be added to the _ZollerACs array. 
//
// **************************************************************************

var _ZollerACs = [];
if (__tdm != undefined) {
  _ZollerACs.push(new ZollerArticleCharacteristicBar(__tdm));
}

function ZollerArticleCharacteristicBar(json) {
  this.ID = "";
  this.Label = "";
  this.Types = [];
  if (json != undefined) {
    if (json.id != undefined) { this.ID = json.id; }
    if (json.label != undefined) { this.Label = json.label; }
    if (json.types != undefined) {
      for (var len = json.types.length, n = 0; n < len; n++) {
        this.Types.push(new ZollerArticleCharacteristicType(json.types[n]));
      }
    }
  }
}
function ZollerArticleCharacteristicType(json) {
  this.ID = "";
  this.Label = "";
  this.Characteristics = [];
  if (json != undefined) {
    if (json.id != undefined) { this.ID = json.id; }
    if (json.label != undefined) { this.Label = json.label; }
    if (json.characteristics != undefined) {
      for (var len = json.characteristics.length, n = 0; n < len; n++) {
        this.Characteristics.push(new ZollerArticleCharacteristic(json.characteristics[n]));
      }
    }
  }
}
function ZollerArticleCharacteristic(json) {
  this.ID = "";
  this.Label = "";
  if (json != undefined) {
    if (json.id != undefined) { this.ID = json.id; }
    if (json.label != undefined) { this.Label = json.label; }
  }
}

function GetACCharacteristicLabelById(systemId, typeId, identifier) {
  if (identifier != undefined && systemId != undefined && typeId != undefined) {
    var c = GetACCharacteristicById(systemId, typeId, identifier);
    if (c != undefined) {
      return c.Label;
    }
  }
}
function GetACCharacteristicById(systemId, typeId, identifier) {
  if (identifier != undefined && systemId != undefined && typeId != undefined) {
    var t = GetACTypeById(systemId, typeId);
    if (t != undefined) {
      for (var len = t.Characteristics.length, n = 0; n < len; n++) {
        if (t.Characteristics[n].ID == identifier) {
          return t.Characteristics[n];
        }
      }
    }
  }
  return undefined;
}
function GetACTypeById(systemId, identifier) {
  if (identifier != undefined && systemId != undefined) {
    var s = GetACSystemById(systemId);
    if (s != undefined) {
      console.log("Found System: ", s);
      for (var len = s.Types.length, n = 0; n < len; n++) {
        if (s.Types[n].ID == identifier) {
          return s.Types[n];
        }
      }
    }
  }
  return undefined;
}
function GetACSystemById(identifier) {
  if (identifier != undefined) {
    for (a = 0; a < _ZollerACs.length; a++) {
      if (_ZollerACs[a].ID == identifier) {
        return _ZollerACs[a];
      }
    }
  }
  return undefined;
}

// **************************************************************************
// *******************************XML Objects*******************************
//
// Notes:
//     These are basic objects containing mostly basic data such as URL's or 
//     raw data values. No sub-objects are used in these. 
//
// **************************************************************************

function ZollerDocument(xml) {
  this.XML = xml;
  var nodeDocument = this.XML;

  this.URI = getValue(nodeDocument, "DocumentUri");
}

function ZollerCharacteristicStructure(xml) {
  console.log("Adding Characteristic structure");
  this.Type = xml.getAttribute("Id");
  this.System = xml.getAttribute("System");
  this.Characteristics = [];
  for (var len = xml.children.length, n = 0; n < len; n++) {
    this.Characteristics.push(new ZollerCharacteristicItem(xml.children[n], this.System, this.Type));
  }
  this.ArticleCharacteristicBar = GetACSystemById(this.System);
  this.ArticleCharacteristicType = GetACTypeById(this.System, this.Type);
}

function ZollerCharacteristicItem(xml, systemId, typeId) {
  //console.log(xml);
  this.Id = xml.tagName;
  this.Label = GetACCharacteristicLabelById(systemId, typeId, this.Id);
  this.Value = xml.innerHTML;
  this.ArticleCharacteristic = GetACCharacteristicById(systemId, typeId, this.Id);
}


// **************************************************************************
// ******************************Image Objects******************************
//
// Notes:
//     The Image Object stores the Filename, Group name, and HTML Image 
//     object necessary for rendering. This object detects the file 
//     extension and changes the URL reference to one that generates an 
//     image out of DXF and STEP file types. 
//
// **************************************************************************

function ZollerGraphicImage(file, group) {
  this.FileName = file;
  this.GraphicGroup = group;
  var img = new Image(_imageMediumPreviewSize.width, _imageMediumPreviewSize.height);
  if (this.FileName.endsWith(".dxf") || this.FileName.endsWith(".stp")) {
    this.ImageURL = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=800&h=600";
    img.src = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + _imageMediumPreviewSize.width + "&h=" + _imageMediumPreviewSize.height;
  } else {
    this.ImageURL = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName;
    img.src = this.ImageURL;
  }
  img.setAttribute("class", "graphic");
  this.Image = img;
}

// **************************************************************************
// *******************************XML Helpers*******************************
//
// Notes:
//     These helper function make it easier read the code in the reference 
//     objects above. 
//
// **************************************************************************

function getValue(xml, name) {
  var rtn = getNodes(xml, name);
  if (rtn.length > 0) {
    return getNodes(xml, name)[0].innerHTML;
  } else {
    return undefined;
  }
}
function getNodes(xml, name) {
  var arr = [];
  if (xml != undefined) {
    for (var len = xml.childNodes.length, n = 0; n < len; n++) {
      if (xml.childNodes[n].tagName == name) {
        arr.push(xml.childNodes[n]);
      } else if (xml.childNodes[n].childNodes.length > 0) {
        var tmpArr = [];
        tmpArr = getNodes(xml.childNodes[n], name);
        if (tmpArr.length > 0) {
          for (m = 0; m < tmpArr.length; m++) {
            arr.push(tmpArr[m]);
          }
        }
      }
    }
  }
  return arr;
}
function getNodeByInnerText(xml, name, search) {
	var arr = getNodes(xml, name);
  for (var len = arr.length, n = 0; n < len; n++) {
		console.log(arr[n].tagName + "=" + name + " (" + (arr[n].tagName == name) + ")  " + arr[n].textContent + "=" + search + " (" + (arr[n].textContent == search) + ")");
    if (arr[n].tagName == name && arr[n].textContent == search) {
      return arr[n];
    } else if (arr[n].childNodes.length > 0) {
			var tmpVal = getNodeByInnerText(arr[n], name, search);
			if (tmpVal != undefined){ return tmpVal; }
    }
  }
  return undefined;
}
function getNodeByTagName(xml, name) {
  for (var len = xml.childNodes.length, n = 0; n < len; n++) {
		console.log(xml.childNodes[n].tagName + "=" + name + " is " + (xml.childNodes[n].tagName == name));
    if (xml.childNodes[n].tagName == name) {
      return xml.childNodes[n];
    } else if (xml.childNodes[n].childNodes.length > 0) {
			var tempVal = getNodeByTagName(xml.childNodes[n], name);
			if (tempVal != undefined){ return tempVal; }
    }
  }
  return undefined;
}

// **************************************************************************
// *******************************Web Request*******************************
//
// Notes:
//     The _WebRequest function depends on a proxy to successfully 
//     communicate with the Zoller Web Service to avoid the Cross-Origin 
//     Request Blocked error. For the most part, only the global variables 
//     should be changed if you are using a similar Web Method. Otherwise, 
//     you may need to change the parameters sent in the xhr.send() 
//     method.
//     
//     _RequestBaseURL:
//     Defines the URI for the proxy service that can send an authenticated 
//     request to the Zoller Web Service.
//     _WebServiceBaseURL:
//     Defines the URI for the Zoller Web Service. (Typically 
//     http://{servername}:80/ZollerDbService/) 
//
// **************************************************************************

var _XMLDeclaration = "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>";

var _RequestBaseURL = "http://server:8086/UpdateSetupSheet.asmx/SetZoller";
var _WebServiceBaseURL = "http://server:8084/ZollerDbService/";
function _WebRequest(method, query, callback, data, async) {
  var xhr = new XMLHttpRequest();
  if (async == undefined) { async = false; }
  xhr.open("POST", _RequestBaseURL, async);

  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  xhr.onprogress = function (e) {
    var done = e.position || e.loaded, total = e.totalSize || e.total;
    console.log("XHR Progress: " + (Math.floor(done / total * 1000) / 10) + '%');
  }
  if (xhr.upload) {
    xhr.upload.onprogress = function (e) {
      var done = e.position || e.loaded, total = e.totalSize || e.total;
      console.log("XHR Upload Progress: " + (Math.floor(done / total * 1000) / 10) + '%');
    }
  }
  xhr.onreadystatechange = function () {
    console.log("_WebRequest: " + xhr.readyState + "   " + xhr.status);
    if (xhr.readyState == 4) {// && xhr.status == 200){
      //console.log(xhr.responseText);
    }
  }
  xhr.send("url=" + encodeURIComponent(_WebServiceBaseURL + query) + "&method=" + method + "&data=" + encodeURIComponent(data));

  if (callback != undefined && callback != null) {
    callback(xhr.responseXML);
  }
  return xhr.responseXML;
}




// **************************************************************************
// ****************************HTML UI Generators****************************
//
// Notes:
//     These functions help create HTML markup that provides an overview of 
//     the provided Zoller object. 
//
// **************************************************************************

function _HTMLDynamic(tag, id, cls, contents) {
  var elmnt = document.createElement(tag);
  elmnt.id = id;
  elmnt.setAttribute("class", cls);
  elmnt.innerHTML = contents;
  return elmnt;
}
function _HTMLField(label, val) {
  var mainDiv = document.createElement("div");
  var lbl = _HTMLDynamic("label", "", "label label-default", label);
  var txt = "<input type='text' class='form-control' value='" + val + "' />";
  mainDiv.appendChild(lbl);
  mainDiv.innerHTML += txt;
  return mainDiv;
}

function HTMLSingleComponent(component) {
  this.Reference = component;
  this.GetMarkup = function () {
    var cmp = this.Reference
    var pnlMain = _HTMLDynamic("div", "pnlComponent" + cmp.ComponentId, "panel-body", "");

    var previewImg = "";

    var txtId = _HTMLField("Component Id", cmp.ComponentId);
    pnlMain.appendChild(txtId);

    var txtDesc = _HTMLField("Description", cmp.Description);
    pnlMain.appendChild(txtDesc);

    var pnlAC = _HTMLDynamic("div", "pnlAC" + cmp.ComponentId, "panel-body", "");
    var acMain, acUl;
    acMain = "<ul>";
    for (var len = cmp.CharacteristicStructures.length, n = 0; n < len; n++) {
      var ac = cmp.CharacteristicStructures[n];
      acMain += "<li>" + ac.System + "</li>";
      acUl = "<ul>";
      for (var clen = ac.Characteristics.length, i = 0; i < clen; i++) {
        if (ac.Characteristics[i].Label != "" && ac.Characteristics[i].ArticleCharacteristic != undefined) {
          acUl += "<li>" + ac.Characteristics[i].Label + ": " + ac.Characteristics[i].Value + "</li>";
        } else {
          acUl += "<li>" + ac.Characteristics[i].Id + ": " + ac.Characteristics[i].Value + "</li>";
        }
      }
      acUl += "</ul>";
      acMain += acUl;
    }
    acMain += "</ul>"
    pnlAC.innerHTML = acMain;
    pnlMain.innerHTML += "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h3>Article Characteristics</h3></div>" + pnlAC.outerHTML + "</div>";

    var pnlGrphcs = _HTMLDynamic("div", "pnlGrphcs" + cmp.ComponentId, "panel-body", "");
    if (cmp.Images.length > 0) {
      for (var len = cmp.Images.length, n = 0; n < len; n++) {
        pnlGrphcs.innerHTML += "<a target=\"_blank\" href=\"" + cmp.Images[n].ImageURL + "\" class=\"graphicLink\">" + cmp.Images[n].Image.outerHTML + "</a>";//<img class=\"graphic\" src=\"" + cmp.Images[n].ImageURL + "\" />
        if (previewImg == "") { previewImg = cmp.Images[n].Image.outerHTML; }
      }
    }
    if (cmp.SVG != undefined) {
      var doc = new DOMParser().parseFromString(cmp.SVG.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), "application/xml");
      var tmpSvg = pnlGrphcs.appendChild(pnlGrphcs.ownerDocument.importNode(doc.documentElement, true));
      tmpSvg.setAttribute("stroke-width", "1");
      tmpSvg.setAttribute("class", "graphic");
      tmpSvg.setAttribute("onclick", "this.classList.toggle('Large');");
    }
    pnlMain.innerHTML += "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h3>Graphics</h3></div>" + pnlGrphcs.outerHTML + "</div>";

    var out = "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h2><a target=\"_blank\" href=\"" + _WebServiceBaseURL + "/Component/" + cmp.ComponentId + "\">Component '" + cmp.ComponentId + "'</a></h2>" + previewImg + "</div>" + pnlMain.outerHTML + "</div>";

    return out;
  }
}
function HTMLTool(tool) {
  this.Reference = tool;
  this.GetMarkup = function () {
    var cmp = this.Reference
    var previewImg = "";
    var pnlMain = _HTMLDynamic("div", "pnlComponent" + cmp.ToolId, "panel-body", "");

    var txtId = _HTMLField("Tool Id", cmp.ToolId);
    pnlMain.appendChild(txtId);

    var txtDesc = _HTMLField("Description", cmp.Description);
    pnlMain.appendChild(txtDesc);

    var pnlAC = _HTMLDynamic("div", "pnlAC" + cmp.ToolId, "panel-body", "");
    var acMain, acUl;
    acMain = "<ul>";
    for (var len = cmp.CharacteristicStructures.length, n = 0; n < len; n++) {
      var ac = cmp.CharacteristicStructures[n];
      acMain += "<li>" + ac.System + "</li>";
      acUl = "<ul>";
      for (var clen = ac.Characteristics.length, i = 0; i < clen; i++) {
        acUl += "<li>" + ac.Characteristics[i].Id + ": " + ac.Characteristics[i].Value + "</li>";
      }
      acUl += "</ul>";
      acMain += acUl;
    }
    acMain += "</ul>"
    pnlAC.innerHTML = acMain;
    pnlMain.innerHTML += "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h3>Article Characteristics</h3></div>" + pnlAC.outerHTML + "</div>";

    var pnlGrphcs = _HTMLDynamic("div", "pnlGrphcs" + cmp.ToolId, "panel-body", "");
    if (cmp.Images.length > 0) {
      for (var len = cmp.Images.length, n = 0; n < len; n++) {
        pnlGrphcs.innerHTML += "<a target=\"_blank\" href=\"" + cmp.Images[n].ImageURL + "\" class=\"graphicLink\">" + cmp.Images[n].Image.outerHTML + "</a>";//<img class=\"graphic\" src=\"" + cmp.Images[n].ImageURL + "\" />
        if (previewImg == "") { previewImg = cmp.Images[n].Image.outerHTML; }
      }
    }
    if (cmp.SVG != undefined) {
      var doc = new DOMParser().parseFromString(cmp.SVG.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), "application/xml");
      var tmpSvg = pnlGrphcs.appendChild(pnlGrphcs.ownerDocument.importNode(doc.documentElement, true));
      tmpSvg.setAttribute("stroke-width", "1");
      tmpSvg.setAttribute("class", "graphic");
      tmpSvg.setAttribute("onclick", "this.classList.toggle('Large');");
    }
    pnlMain.innerHTML += "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h3>Graphics</h3></div>" + pnlGrphcs.outerHTML + "</div>";

    var pnlSC = _HTMLDynamic("div", "pnlSC" + cmp.ToolId, "panel-body", "");
    var scMain;
    scMain = "<ul>";
    for (var len = cmp.SingleComponents.length, n = 0; n < len; n++) {
      var sc = cmp.SingleComponents[n];
      scMain += "<li><button type=\"button\" onclick=\"var tmpSC = new ZollerSingleComponent('" + cmp.SingleComponents[n].ComponentId + "');tmpSC.DrawHTML(pnlSingleComponentPreview);\">" + cmp.SingleComponents[n].ComponentId + "</button></li>";
    }
    scMain += "</ul>"
    pnlAC.innerHTML = scMain;
    pnlMain.innerHTML += "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h3>Single Components</h3></div>" + pnlAC.outerHTML + "<div id='pnlSingleComponentPreview'></div></div>";

    var out = "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h2><a target=\"_blank\" href=\"" + _WebServiceBaseURL + "/Tool/" + cmp.ToolId + "\">Tool '" + cmp.ToolId + "'</a></h2>" + previewImg + "</div>" + pnlMain.outerHTML + "</div>";

    return out;
  }
}
function HTMLSettingSheet(settingsheet) {
  this.Reference = settingsheet;
  this.GetMarkup = function () {
    var cmp = this.Reference
    var pnlMain = _HTMLDynamic("div", "pnlComponent" + cmp.SettingSheetId, "panel-body", "");

    var previewImg = "";
    var txtId = _HTMLField("Setting Sheet Id", cmp.SettingSheetId);
    pnlMain.appendChild(txtId);

    var txtPartNo = _HTMLField("Part #", cmp.Name);
    pnlMain.appendChild(txtPartNo);

    var txtStep = _HTMLField("Step #", cmp.WorkStep);
    pnlMain.appendChild(txtStep);

    var pnlGrphcs = _HTMLDynamic("div", "pnlGrphcs" + cmp.ToolId, "panel-body", "");
    if (cmp.Images.length > 0) {
      for (var len = cmp.Images.length, n = 0; n < len; n++) {
        pnlGrphcs.innerHTML += "<a target=\"_blank\" href=\"" + cmp.Images[n].ImageURL + "\" class=\"graphicLink\">" + cmp.Images[n].Image.outerHTML + "</a>";//<img class=\"graphic\" src=\"" + cmp.Images[n].ImageURL + "\" />
        if (previewImg == "") { previewImg = cmp.Images[n].Image.outerHTML; }
      }
    }

    var pnlT = _HTMLDynamic("div", "pnlSC" + cmp.SettingSheetId, "panel-body", "");
    var tMain;
    tMain = "<ul>";
    for (var len = cmp.Tools.length, n = 0; n < len; n++) {
      var sc = cmp.Tools[n];
      tMain += "<li><button type=\"button\" onclick=\"var tmpT = new ZollerTool('" + cmp.Tools[n].ToolId + "');tmpT.DrawHTML(pnlToolPreview);\">" + cmp.Tools[n].ToolId + "</button></li>";
    }
    tMain += "</ul>"
    pnlT.innerHTML = tMain;
    pnlMain.innerHTML += "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h3>Tools</h3></div>" + pnlT.outerHTML + "<div id='pnlToolPreview'></div></div>";

    var out = "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h2><a target=\"_blank\" href=\"" + _WebServiceBaseURL + "/Tool/" + cmp.SettingSheetId + "\">Tool '" + cmp.SettingSheetId + "'</a></h2>" + previewImg + "</div>" + pnlMain.outerHTML + "</div>";

    return out;
  }
}

