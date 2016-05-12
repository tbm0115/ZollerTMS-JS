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
var _interfaceSizes = ["sm", "md", "lg"];
var _DefaultInterfaceSize = _interfaceSizes[2];

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
  if (id == undefined) {
    this.AdapterId = "";
    this.Name = "";
    this.AdapterType = "";
    this.Images = [];
    this.GetZollerData = function (id) {
      return new ZollerAdapter(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
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
    return;
  }
  nodeAdapter = getNodeByTagName(this.XML, "Adapter");

  this.AdapterId = getValue(nodeAdapter, "AdapterId");
  this.Name = getValue(nodeAdapter, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.AdapterType = getValue(nodeAdapter, "AdapterType");
  var adapPres = getNodeByTagName(nodeAdapter, "AdapterPresetter");
  this.AdapterPresetter = {
    CES: getValue(adapPres, "CES"),
    Focus: getValue(adapPres, "Focus"),
    MsrRangeWidth: getValue(adapPres, "MsrRangeWidth"),
    MsrRangeHeight: getValue(adapPres, "MsrRangeHeight"),
    IsTurnable: getValue(adapPres, "IsTurnable"),
    IsDriven: getValue(adapPres, "IsDriven"),
    IsHSKAdapter: getValue(adapPres, "IsHSKAdapter"),
    TIReindexSpindle: getValue(adapPres, "TIReindexSpindle"),
    CheckToolClamp: getValue(adapPres, "CheckToolClamp"),
    ZRefMode: getValue(adapPres, "ZRefMode"),
    ZDiaMode: getValue(adapPres, "ZDiaMode"),
    XRefMode: getValue(adapPres, "XRefMode"),
    XDiaMode: getValue(adapPres, "XDiaMode"),
    UseMode: getValue(adapPres, "UseMode"),
    RunOutDoCorrection: getValue(adapPres, "RunOutDoCorrection"),
    AxialRadialRunOutDoCorrection: getValue(adapPres, "AxialRadialRunOutDoCorrection"),
    DetectAdapterCenter: getValue(adapPres, "DetectAdapterCenter"),
    BarcodeDoRotation: getValue(adapPres, "BarcodeDoRotation"),
    BarcodeManualIllumination: getValue(adapPres, "BarcodeManualIllumination")
  }
  this.Images = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeAdapter.children.length, n = 0; n < len; n++) {
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
  if (id == undefined) {
    this.MachineId = '';
    this.Name = '';
    this.Description = '';
    this.MagazineCapacity = '';
    this.NCToDirectory = '';
    this.NCFromDirectory = '';
    this.MachineType = '';
    this.Manufacturer = '';
    this.Images = [];
    this.Tools = [];
    this.SettingSheets = [];
    this.Accessories = [];
    this.Adapters = [];
    this.Documents = [];
    this.GetZollerData = function (id) {
      return new ZollerMachine(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
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
    return;
  }
  nodeMachine = getNodeByTagName(this.XML, "Machine");


  this.MachineId = getValue(nodeMachine, "MachineId");// Grabbing the global value is okay because it only returns the first instance of the object
  this.Name = getValue(nodeMachine, "Name");
  this.Description = getValue(nodeMachine, "Description");
  this.NoOfMagazinPositions = getValue(nodeMachine, "NoOfMagazinPositions");
  this.NcProgrammTransferPath = getValue(nodeMachine, "NcProgrammTransferPath");
  this.NcProgrammDeleteBeforeTransfer = getValue(nodeMachine, "NcProgrammDeleteBeforeTransfer");
  this.NcProgrammDeleteAfterTransfer = getValue(nodeMachine, "NcProgrammDeleteAfterTransfer");
  this.NcProgrammTransferBackPath = getValue(nodeMachine, "NcProgrammTransferBackPath");
  this.NcProgrammSplit = getValue(nodeMachine, "NcProgrammSplit");
  this.UseTurningAdvisor = getValue(nodeMachine, "UseTurningAdvisor");
  this.PostProcessorId = getValue(nodeMachine, "PostProcessorId");
  this.CommunicationDevice = getValue(nodeMachine, "CommunicationDevice");
  this.DatasetState = getValue(nodeMachine, "DatasetState");
  this.Type = getValue(nodeMachine, "Type");
  this.Manufacturer = getValue(nodeMachine, "Manufacturer");

  this.Images = [];
  this.Tools = [];
  this.SettingSheets = [];
  this.Accessories = [];
  this.Adapters = [];
  this.Documents = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeMachine.children.length, n = 0; n < len; n++) {
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeMachine.children[n].tagName == "GraphicFile" + graphicSuffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeMachine.children[n].innerHTML, nodeMachine.children[n + 1].innerHTML));
      }
    }
    // Get Components and Tools of the Machine
    if (nodeMachine.children[n].tagName == "MachineToolList") {
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
  if (id == undefined) {
    this.SettingSheetId = '';
    this.Name = '';
    this.WorkStep = '';
    this.Machine;
    this.Images = [];
    this.Tools = [];
    this.Documents = [];
    this.GetZollerData = function (id) {
      return new ZollerSettingSheet(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
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
    return;
  }
  nodeSettingSheet = getNodeByTagName(this.XML, "SettingSheet");

  this.SettingSheetId = getValue(nodeSettingSheet, "SettingSheetId");
  this.Name = getValue(nodeSettingSheet, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.WorkStep = getValue(nodeSettingSheet, "WorkStep");
  this.DatasetState = getValue(nodeSettingSheet, "DatasetState");
  this.InvMode = getValue(nodeSettingSheet, "InvMode");
  this.InvPhysical = getValue(nodeSettingSheet, "InvPhysical");
  this.InvFullCopy = getValue(nodeSettingSheet, "InvFullCopy");

  this.Images = [];
  this.Tools = [];
  this.Documents = [];
  this.Machine;

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeSettingSheet.children.length, n = 0; n < len; n++) {
    // Get Machine of the SettingSheet
    if (nodeSettingSheet.children[n].tagName == "Machine") {
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
}

function ZollerTool(id) {
  if (id == undefined) {
    this.ToolId = "";
    this.Description = "";
    this.CharacteristicStructures = [];
    this.Images = [];
    this.SingleComponents = [];
    this.Accessories = [];
    this.Documents = [];
    this.GetZollerData = function (id) {
      return new ZollerTool(id);
    }
    this.Collected = false; // Custom flag determining if the tool items have been physically collected.
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  // This function generates the HTML to be added to the document. 'Size' represents the preferred sizing of the interface for the user. The available options are 'sm', 'md', and 'lg'. These can be adjusted in 'Zoller Interface.css'.
  this.DrawHTML = function (size, parent, overwrite) {
    var ass = document.createElement("div");
    ass.setAttribute("class", "assembly assembly-" + size);

    var divName = document.createElement("div");
    divName.setAttribute("class", "assembly-name");
    divName.setAttribute("data-tool", this.ToolId);
    divName.onclick = function () {
      this.classList.toggle("clicked");
    }
    var divId = document.createElement("span");
    divId.setAttribute("class", "id");
    divId.innerHTML = this.ToolId;
    divId.setAttribute("title", "Tool Id");
    divName.appendChild(divId);

    var divCnt = document.createElement("span");
    divCnt.setAttribute("class", "childcount");
    divCnt.innerHTML = this.SingleComponents.length;
    divName.appendChild(divCnt);

    var pName = document.createElement("p");
    pName.innerHTML = this.Description;
    divName.appendChild(pName);

    var imgName = document.createElement("img");
    if (this.Images.length > 0) {
      imgName.src = this.Images[0].GetCustomImageURL(800, 600);
    }
    divName.appendChild(imgName);

    if (!this.IsTrueZoller) {
      var delName = document.createElement("a");
      delName.setAttribute("class", "delete");
      divName.appendChild(delName);
    } else {
      var zolIcon = document.createElement("span");
      zolIcon.setAttribute("class", "zollerTool");
      zolIcon.onclick = function (e) {
        MessageBox.Show("This is a tool assembly managed by Zoller TMS. The tool can only be modified or removed from the Setup Sheet via the Zoller TMS interface.",
          "Tool Locked", MessageBox.BoxType.Okay, "info", undefined);
        e.preventDefault();
      }
      divName.appendChild(zolIcon);
    }

    if (!this.IsTrueZoller) {
      var btnName = document.createElement("a");
      //btnName.setAttribute("type", "button");
      btnName.setAttribute("class", "add-component");
      divName.appendChild(btnName);
    }

    ass.appendChild(divName);

    for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
      var divItem = document.createElement("div");
      divItem.setAttribute("class", "assembly-item");
      divItem.setAttribute("data-tool", this.ToolId);
      divItem.setAttribute("data-component", this.SingleComponents[n].ComponentId);
      divItem.setAttribute("draggable", "true");
      var aItem = document.createElement("a");
      var pId = document.createElement("p");
      pId.innerHTML = this.SingleComponents[n].ComponentId;
      pId.setAttribute("title", "Component Id");
      aItem.appendChild(pId);
      var pDescription = document.createElement("p");
      if (this.SingleComponents[n].SpecialDescription) {
        pDescription.innerHTML = this.SingleComponents[n].SpecialDescription;
      } else {
        pDescription.innerHTML = this.SingleComponents[n].Description;
      }
      aItem.appendChild(pDescription);
      var divItemImg = document.createElement("div");
      divItemImg.setAttribute("class", "item-image");
      var imgItem = document.createElement("img");
      if (this.SingleComponents[n].Images.length > 0) {
        imgItem.setAttribute("src", this.SingleComponents[n].Images[0].ImageURL);
      }
      divItemImg.appendChild(imgItem);
      aItem.appendChild(divItemImg);
      divItem.appendChild(aItem);
      if (!this.IsTrueZoller) {
        var delItem = document.createElement("a");
        delItem.setAttribute("class", "delete");
        divItem.appendChild(delItem);
      }

      ass.appendChild(divItem);
    }
    if (typeof parent !== "undefined" && parent !== undefined) {
      if (overwrite !== undefined || overwrite == false) {
        var ex = parent.querySelector("[data-tool='" + this.ToolId + "']").parentElement;
        if (ex !== undefined) {
          parent.insertBefore(ass, ex);
          parent.removeChild(ex);
        } else {
          parent.appendChild(ass);
        }
        setHandlers();
      } else {
        parent.appendChild(ass);
        setHandlers();
      }
    } else {
      return ass;
    }
  }

  this.Notes = ""; // Custom property
  this.IsTrueZoller = false; // Custom property

  // This function can be altered to generate a custom XML structure to store Tool assemblies in non-Zoller storage. It is important that this is defined before SetXML() to avoid an undefined function.
  this.GetXML = function () {
    var out = "<Assembly id=\"" + this.ToolId + "\" name=\"" + this.Description + "\" iszoller=\"" + this.IsTrueZoller + "\">";
    if (this.SingleComponents != undefined) {
      for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
        out += "<Tool id=\"" + this.SingleComponents[n].ComponentId + "\">";
        for (a = 0; a < this.SingleComponents[n].CharacteristicStructures.length; a++) {
          if (this.SingleComponents[n].CharacteristicStructures[a].System == "SSS") {
            for (b = 0; b < this.SingleComponents[n].CharacteristicStructures[a].Characteristics.length; b++) {
              out += "<Characteristic label=\"" + this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Label + "\">";
              out += this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Value + "</Characteristics>";
            }
          }
        }
        out += "<Notes>" + this.SingleComponents[n].Notes + "</Notes>";
        out += "</Tool>";
      }
    }
    out += "</Assembly>";
    return out;
  }

  // Determine if the object is a valid Zoller object by attempting to get data from the Zoller WebService.
  console.log("Object type is: ", (typeof id));
  var nodeTool;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Tool/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
    return;
  }
  nodeTool = getNodeByTagName(this.XML, "Tool");

  this.IsTrueZoller = true; // Custom property
  this.Collected = false; // Custom property, flag determining if the tool items have been physically collected.

  this.ToolId = getValue(nodeTool, "ToolId");
  this.Description = getValue(nodeTool, "Description");// Grabbing the global value is okay because it only returns the first instance of the object
  this.TNo = getValue(nodeTool, "TNo");
  this.LongComment = convertToPlain(getValue(nodeTool, "LongComment"));
  this.Wobble = getValue(nodeTool, "Wobble");
  this.DxfDisplayMode = getValue(nodeTool, "DxfDisplayMode");
  this.VerifiedForMeasuring = getValue(nodeTool, "VerifiedForMeasuring");
  this.IsLifetimeExpired = getValue(nodeTool, "IsLifetimeExpired");
  this.DxfDoMirrowX = getValue(nodeTool, "DxfDoMirrowX");
  this.DxfDoMirrowY = getValue(nodeTool, "DxfDoMirrowY");
  this.DxfDoRotate = getValue(nodeTool, "DxfDoRotate");
  this.DxfRotateAngl = getValue(nodeTool, "DxfRotateAngl");
  this.AxialRunOut = getValue(nodeTool, "AxialRunOut");
  this.IsPartsExpired = getValue(nodeTool, "IsPartsExpired");
  this.UseTurningAdvisor = getValue(nodeTool, "UseTurningAdvisor");
  this.TAAdapterSwapped = getValue(nodeTool, "TAAdapterSwapped");
  this.DatasetState = getValue(nodeTool, "DatasetState");
  this.InvMode = getValue(nodeTool, "InvMode");
  this.InvPhysical = getValue(nodeTool, "InvPhysical");
  this.InvFullCopy = getValue(nodeTool, "InvFullCopy");
  this.UsedAdapterId = getValue(nodeTool, "UsedAdapterId");
  this.UsedAdapterName = getValue(nodeTool, "UsedAdapterName");

  this.CharacteristicStructures = [];
  this.Images = [];
  this.SingleComponents = [];
  this.Accessories = [];
  this.Documents = [];
  this.SVG = getValue(nodeTool, "ScalableVectorGraphic");// Get the most pertinent SVG data if available.


  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeTool.children.length, n = 0; n < len; n++) {
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
}

function ZollerSingleComponent(id) {
  if (id == undefined) {
    this.ComponentId = "";
    this.Description = "";
    this.CharacteristicStructures = [];
    this.Images = [];
    this.Accessories = [];
    this.Documents = [];
    this.GetZollerData = function (id) {
      return new ZollerSingleComponent(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  // Determine if the object is a valid Zoller object by attempting to get data from the Zoller WebService.
  console.log("Object type is: ", (typeof id));
  var nodeComponent;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Component/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
    return;
  }
  nodeComponent = getNodeByTagName(this.XML, "Component");

  this.ComponentId = getValue(nodeComponent, "ComponentId");
  this.Description = getValue(nodeComponent, "Description");
  this.PartClass = getValue(nodeComponent, "PartClass");
  this.SubjectNo = getValue(nodeComponent, "SubjectNo");
  this.Norm = getValue(nodeComponent, "Norm");
  this.LongComment = convertToPlain(getValue(nodeComponent, "LongComment"));
  this.StorageUse = getValue(nodeComponent, "StorageUse");
  this.InterfaceCodingToolSide = getValue(nodeComponent, "InterfaceCodingToolSide");
  this.InterfaceCodingMachineSide = getValue(nodeComponent, "InterfaceCodingMachineSide");
  this.GeneratedInterfaceCodingMachineSide = getValue(nodeComponent, "GeneratedInterfaceCodingMachineSide");
  this.CouplingUseCharacteristic = getValue(nodeComponent, "CouplingUseCharacteristic");
  this.DatasetState = getValue(nodeComponent, "DatasetState");
  this.InvMode = getValue(nodeComponent, "InvMode");
  this.InvPhysical = getValue(nodeComponent, "InvPhysical");
  this.InvFullCopy = getValue(nodeComponent, "InvFullCopy");
  this.SVG = getValue(nodeComponent, "ScalableVectorGraphic");

  this.CharacteristicStructures = [];
  this.Images = [];
  this.Accessories = [];
  this.Documents = [];

  this.EDP = getValue(nodeComponent, "SubjectNo"); // Custom property
  this.OrderCode = getValue(nodeComponent, "Norm"); // Custom property
  this.Notes = ""; // Custom property

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
      var cmpnts = getNodes(nodeComponent.children[n], "Document");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No documents found in ExternalDocument Data");
      }
    }
    if (nodeComponent.children[n].tagName == "MAN") {
      this.Manufacturer = nodeComponent.children[n].innerHTML;
    }
    if (nodeComponent.children[n].tagName == "SPECDESC") {
      this.SpecialDescription = nodeComponent.children[n].innerHTML;
    }
    if (nodeComponent.children[n].tagName == "CAT") {
      this.Category = nodeComponent.children[n].innerHTML;
    }
  }
}

function ZollerAccessory(id) {
  if (id == undefined) {
    this.AccessoryId = '';
    this.Description = '';
    this.GetZollerData = function (id) {
      return new ZollerSettingSheet(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
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
    return;
  }
  nodeAccessory = getNodeByTagName(this.XML, "Accessory");

  this.AccessoryId = getValue(nodeAccessory, "AccessoryId");

  this.Description = getValue(nodeAccessory, "Description");
  this.LongComment = convertToPlain(getValue(nodeAccessory, "LongComment"));
}

function ZollerFixture(id) {
  if (id == undefined) {
    this.FixtureId = "";
    this.Description = "";
    this.GetZollerData = function (id) {
      return new ZollerFixture(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeFixture;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Fixture/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
    return;
  }
  nodeFixture = getNodeByTagName(this.XML, "Fixture");

  this.FixtureId = getValue(nodeFixture, "FixtureId");

  this.Description = getValue(nodeFixture, "Description");
  this.ClampingDescription = getValue(nodeFixture, "ClampingDescription");
  this.DrawingNo = getValue(nodeFixture, "DrawingNo");
  this.Weight = getValue(nodeFixture, "Weight");
  this.IsFixtureActive = getValue(nodeFixture, "IsFixtureActive");
  this.IsSubFixture = getValue(nodeFixture, "IsSubFixture");
  this.StorageLocation = getValue(nodeFixture, "StorageLocation");
  this.DatasetState = getValue(nodeFixture, "DatasetState");
  this.InvMode = getValue(nodeFixture, "InvMode");
  this.InvPhysical = getValue(nodeFixture, "InvPhysical");
  this.InvFullCopy = getValue(nodeFixture, "InvFullCopy");
  this.LongComment = convertToPlain(getValue(nodeFixture, "LongComment"));
  this.Image = new ZollerGraphicImage(getValue(nodeFixture, "GraphicFile"), getValue(nodeFixture, "GraphicGroup"));

  this.Notes = ""; // Custom property
  this.PalletJawNo = ""; // Custom property
  this.ClampingPressure = ""; // Custom property
  this.ClampingDiagram = ""; // Custom property
  this.Remark = ""; // Custom property
	
  this.GetJSON = function(){
    var out = "{\"id\":\"" + this.FixtureId + "\",";
    out += "\"Notes\":\"" + this.Notes + "\",";
    out += "\"PalletJawNo\":\"" + this.PalletJawNo + "\",";
    out += "\"ClampingPressure\":\"" + this.ClampingPressure + "\",";
    out += "\"ClampingDiagram\":\"" + this.ClampingDiagram + "\",";
    out += "\"Remark\":\"" + this.Remark + "\"";
    out += "}";
    return out;
  }
	
  this.DrawHTML = function (size, parent, overwrite) {
    var fixt = document.createElement("div");
    fixt.setAttribute("class", "fixture fixture-" + size);
    fixt.setAttribute("data-fixture", this.FixtureId);
    var fixtCol1 = document.createElement("div");
    fixtCol1.setAttribute("class", "fixture-name");
    var fixtName = document.createElement("p");
    fixtName.innerHTML = "(" + this.FixtureId + ") " + this.Description;
    fixtCol1.appendChild(fixtName);
    var fixtImg = document.createElement("img");
    if (this.Image != undefined) {
      fixtImg.src = this.Image.GetCustomImageURL(800, 600);
    }
    fixtCol1.appendChild(fixtImg);

    var fixtCol2 = document.createElement("div");
    fixtCol2.setAttribute("class", "fixture-item");
    var fixtNotes = document.createElement("textarea");
    if (this.Notes != undefined && this.Notes != "") {
      fixtNotes.value = this.Notes;
    } else if (this.LongComment != undefined && this.LongComment != "") {
      fixtNotes.value = "[Zoller Comment] " + this.LongComment;
      fixtNotes.setAttribute("disabled", "disabled");
    } else if (this.ClampingDescription != undefined && this.ClampingDescription != "") {
      fixtNotes.value = "[Zoller Clamping] " + this.ClampingDescription;
      fixtNotes.setAttribute("disabled", "disabled");
    }
    fixtCol2.appendChild(fixtNotes);

    fixt.appendChild(fixtCol1);
    fixt.appendChild(fixtCol2);

    if (typeof parent !== "undefined" && parent !== undefined) {
      if (overwrite !== undefined || overwrite == false) {
        var ex = parent.querySelector("[data-fixture='" + this.FixtureId + "']").parentElement;
        if (ex !== undefined) {
          parent.insertBefore(fixt, ex);
          parent.removeChild(ex);
        } else {
          parent.appendChild(fixt);
        }
        setHandlers();
      } else {
        parent.appendChild(fixt);
        setHandlers();
      }
    } else {
      return fixt;
    }
  }
}

function ZollerMeasuringDeviceV2(id) {
  if (id == undefined) {
    this.MeasuringDeviceId = "";
    this.Description = "";
    this.GetZollerData = function (id) {
      return new ZollerMeasuringDeviceV2(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeMeasuringDevice;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "MeasuringDeviceV2/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
    return;
  }
  nodeMeasuringDevice = getNodeByTagName(this.XML, "MeasuringDeviceV2");

  this.MeasuringDeviceId = getValue(nodeMeasuringDevice, "MeasuringDeviceId");

  this.Description = getValue(nodeMeasuringDevice, "Description");
  this.IsCalibrator = getValue(nodeMeasuringDevice, "IsCalibrator");
  this.InternalTest = getValue(nodeMeasuringDevice, "InternalTest");
  this.CheckDateInterval = getValue(nodeMeasuringDevice, "CheckDateInterval");
  this.CheckUsageCount = getValue(nodeMeasuringDevice, "CheckUsageCount");
  this.MeasuringDeviceStateAfterCalibration = getValue(nodeMeasuringDevice, "MeasuringDeviceStateAfterCalibration");
  this.DatasetState = getValue(nodeMeasuringDevice, "DatasetState");
  this.MeasuringRangeMin = getValue(nodeMeasuringDevice, "MeasuringRangeMin");
  this.MeasuringRangeMax = getValue(nodeMeasuringDevice, "MeasuringRangeMax");
  this.MainTestValue = getValue(nodeMeasuringDevice, "MainTestValue");
  this.MeasuringDeviceType = getValue(nodeMeasuringDevice, "MeasuringDeviceType");
  this.MainTestValueUpperTol = getValue(nodeMeasuringDevice, "MainTestValueUpperTol");
  this.MainTestValueLowerTol = getValue(nodeMeasuringDevice, "MainTestValueLowerTol");
  this.MeasuringPrecision = getValue(nodeMeasuringDevice, "MeasuringPrecision");
  this.InvFullCopy = getValue(nodeMeasuringDevice, "InvFullCopy");
}

function ZollerStorage(id) {
  if (id == undefined) {
    this.StorageId = "";
    this.GetZollerData = function (id) {
      return new ZollerStorage(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
    this.XML = xml;
    if (xml.firstChild != null && xml.firstChild.hasAttribute != null) {
      if (xml.firstChild.hasAttribute("result")) {
        if (xml.firstChild.getAttribute("result") == "fail") {
          console.log("Invalid response from TMS!");
        }
      }
    }
  }

  console.log("Object type is: ", (typeof id));
  var nodeStorage;
  if ((typeof id) == "string") {
    this.XML = _WebRequest("GET", "Storage/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
    return;
  }
  nodeStorage = getNodeByTagName(this.XML, "Storage");

  this.StorageId = getValue(nodeStorage, "StorageId");

  this.Width = getValue(nodeStorage, "Width");
  this.Height = getValue(nodeStorage, "Height");
  this.Depth = getValue(nodeStorage, "Depth");
  this.ExternalSystemControl = getValue(nodeStorage, "ExternalDocument");
  this.Type = getValue(nodeStorage, "Type");
  this.CirculationControl = getValue(nodeStorage, "CirculationControl");
  this.IsStockOrderNeeded = getValue(nodeStorage, "IsStockOrderNeeded");
  this.DatasetState = getValue(nodeStorage, "DatasetState");
  var sp = getNode(nodeStorage, "StoragePlace");
  this.StoragePlace = {
    StoragePlaceBaseId: getValue(sp, "StoragePlaceBaseId"),
    Description: getValue(sp, "Description")
  }
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
// __tdm is a custom JSON object that represents a custom Article Characteristic Bar. The JSON helps define the appropriate labels for each identifier.
if (typeof __tdm !== "undefined") {
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
  if (this.FileName != undefined && this.GraphicGroup != undefined) {
    if (this.FileName.endsWith(".dxf") || this.FileName.endsWith(".stp")) {
      this.ImageURL = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=800&h=600";
      img.src = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + _imageMediumPreviewSize.width + "&h=" + _imageMediumPreviewSize.height;
    } else {
      this.ImageURL = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName;
      img.src = this.ImageURL;
    }
  }
  img.setAttribute("class", "graphic");
  this.Image = img;
  this.GetCustomImageURL = function (width, height) {
    return _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + width + "&h=" + height;
  }
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
    if (arr[n].tagName == name && arr[n].textContent == search) {
      return arr[n];
    } else if (arr[n].childNodes.length > 0) {
      var tmpVal = getNodeByInnerText(arr[n], name, search);
      if (tmpVal != undefined) { return tmpVal; }
    }
  }
  return undefined;
}
function getNodeByTagName(xml, name) {
  if (typeof xml.tagName !== "undefined") {
    if (xml.tagName == name) {
      return xml;
    }
  }
  for (var len = xml.childNodes.length, n = 0; n < len; n++) {
    if (xml.childNodes[n].tagName == name) {
      return xml.childNodes[n];
    } else if (xml.childNodes[n].childNodes.length > 0) {
      var tempVal = getNodeByTagName(xml.childNodes[n], name);
      if (tempVal != undefined) { return tempVal; }
    }
  }
  return undefined;
}

function convertToPlain(rtf) {
  if (rtf != undefined) {
    rtf = rtf.replace(/\\par[d]?/g, "");
    return rtf.replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "").trim();
  } else {
    return "";
  }
}
function convertToRtf(plain) {
  if (plain != undefined) {
    plain = plain.replace(/\n/g, "\\par\n");
    return "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang2057{\\fonttbl{\\f0\\fnil\\fcharset0 Microsoft Sans Serif;}}\n\\viewkind4\\uc1\\pard\\f0\\fs17 " + plain + "\\par\n}";
  } else {
    return "";
  }
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
      if (xhr.status == 200) {
        if (callback != undefined && callback != null) {
          callback(xhr.responseXML);
        }
      }
    }
  }
  if (data === null) {
    xhr.send("url=" + encodeURIComponent(_WebServiceBaseURL + query) + "&method=" + method + "&data=");
  } else {
    xhr.send("url=" + encodeURIComponent(_WebServiceBaseURL + query) + "&method=" + method + "&data=" + encodeURIComponent(data));
  }

  return xhr.responseXML;
}

// **************************************************************************
// ********************************UI Events********************************
//
// Notes:
//     These functions are handlers for various user interface functions 
//     such as drag and drop, adding/deleting, etc. 
//
// **************************************************************************

function RaiseToolDeleteEvent(Tool) {
  var evt = document.createEvent("Events");
  evt.initEvent("tooldelete", true, true);
  evt.ToolId = Tool;
  document.dispatchEvent(evt);
}
function RaiseComponentDeleteEvent(Component, Tool) {
  var evt = document.createEvent("Events");
  evt.initEvent("componentdelete", true, true);
  evt.ComponentId = Component;
  evt.ToolId = Tool;
  document.dispatchEvent(evt);
}
function RaiseComponentAddEvent(Tool) {
  var evt = document.createEvent("Events");
  evt.initEvent("componentadd", true, true);
  evt.ToolId = Tool;
  document.dispatchEvent(evt);
}
function RaiseToolEditEvent(Tool) {
  var evt = document.createEvent("Events");
  evt.initEvent("tooledit", true, true);
  evt.ToolId = Tool;
  document.dispatchEvent(evt);
}
function RaiseComponentSelectedEvent(Component, Tool) {
  var evt = document.createEvent("Events");
  evt.initEvent("componentselected", true, true);
  evt.ToolId = Tool;
  evt.ComponentId = Component;
  document.dispatchEvent(evt);
}
function RaiseToolSelectedEvent(Tool) {
  var evt = document.createEvent("Events");
  evt.initEvent("toolselected", true, true);
  evt.ToolId = Tool;
  document.dispatchEvent(evt);
}
function RaiseFixtureSelectedEvent(Fixture) {
  var evt = document.createEvent("Events");
  evt.initEvent("fixtureselected", true, true);
  evt.FixtureId = Fixture;
  document.dispatchEvent(evt);
}

var dragSrcEl = null;
function handleDragStart(e) {
  this.style.opacity = "0.4";  // this / e.target is the source node.

  dragSrcEl = this;
  console.log("DragSource: ", dragSrcEl);

  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", this.outerHTML);
}
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }
  if (dragSrcEl.dataset.tool == this.dataset.tool) {
    e.dataTransfer.dropEffect = "move";  // See the section on the DataTransfer object.
    if (handleDragOver.lastElement == undefined) {
      handleDragOver.lastElement = this;
      handleDragOver.lastElement.classList.add("over");
    } else {
      handleDragOver.lastElement.classList.remove("over");
      handleDragOver.lastElement = this;
      handleDragOver.lastElement.classList.add("over");
    }
  } else {
    e.dataTransfer.dropEffect = "none";
  }

  return false;
}
function handleDragEnter(e) {
  // this / e.target is the current hover target.
  console.log("Drag Entered: ", this);
}
function handleDragLeave(e) {
  //this.classList.remove("over");  // this / e.target is previous target element.
}
function handleDrop(e) {
  if (e.preventDefault) { e.preventDefault(); }
  if (e.stopPropagation) { e.stopPropagation(); }

  // Don't do anything if dropping the same column we're dragging.
  if (dragSrcEl != this) {
    // Set the source column's HTML to the HTML of the column we dropped on.
    console.log("Source: ", dragSrcEl);
    console.log("Target: ", this);
    dragSrcEl.outerHTML = this.outerHTML;
    this.outerHTML = e.dataTransfer.getData('text/html');
    setHandlers();
  }

  return false;
}
function handleDragEnd(e) {
  // this/e.target is the source node.
  var cols = document.querySelectorAll('.assembly-item');
  [].forEach.call(cols, function (col) {
    col.classList.remove('over');
    col.style.opacity = "1";
  });
}

function toggleEdit(state) {
  var els = document.querySelectorAll(".delete");
  [].forEach.call(els, function (el) {
    el.classList.toggle("noEdit", !state);
  });
  els = document.querySelectorAll(".add-component");
  [].forEach.call(els, function (el) {
    el.classList.toggle("noEdit", !state);
  });
}
function deleteComponent(e) {
  RaiseComponentDeleteEvent(e.target.parentElement.dataset.component, e.target.parentElement.dataset.tool);
  e.preventDefault();
}
function deleteTool(e) {
  RaiseToolDeleteEvent(e.target.parentElement.dataset.tool);
  e.preventDefault();
}
function selectedComponent(e) {
  // Double check that another function wasn't intended
  if (e.target.tagName == "A") { return false }
  var d = e.target;
  while (d.getAttribute("class") != "assembly-item") {
    d = d.parentElement;
  }
  RaiseComponentSelectedEvent(d.dataset.component, d.dataset.tool)
}

function setHandlers() {
  var cols = document.querySelectorAll(".assembly-item");
  [].forEach.call(cols, function (col) {
    // Drag and Drop functions
    col.ondragstart = handleDragStart;
    col.ondragenter = handleDragEnter;
    col.ondragover = handleDragOver;
    col.ondragleave = handleDragLeave;
    col.ondrop = handleDrop;
    col.ondragend = handleDragEnd;

    // Click function
    col.onclick = selectedComponent;
  });
  cols = document.querySelectorAll(".assembly-item > .delete");
  [].forEach.call(cols, function (col) {
    col.onclick = deleteComponent;
  });
  cols = document.querySelectorAll(".assembly-name > .delete");
  [].forEach.call(cols, function (col) {
    col.onclick = deleteTool;
  });
  cols = document.querySelectorAll(".assembly-name");
  [].forEach.call(cols, function (col) {
    col.onclick = function (e) {
      // Place event here
      // Double check that another function wasn't intended
      if (e.target.getAttribute("class") === null) {
        this.classList.toggle("clicked");
        RaiseToolSelectedEvent(this.dataset.tool);
      } else if (e.target.getAttribute("class").indexOf("assembly-name") > -1) {
        this.classList.toggle("clicked");
        RaiseToolSelectedEvent(this.dataset.tool);
      }
    }
  });
  cols = document.querySelectorAll(".add-component");
  [].forEach.call(cols, function (col) {
    col.onclick = function (e) {
      RaiseComponentAddEvent(e.target.parentElement.dataset.tool)
    };
  });
  cols = document.querySelectorAll(".fixture");
  [].forEach.call(cols, function (col) {
    col.onclick = function (e) {
      // Place event here
      // Double check that another function wasn't intended
      if (e.target.getAttribute("class") === null) {
        this.classList.toggle("clicked");
        RaiseFixtureSelectedEvent(this.dataset.fixture);
      } else if (e.target.getAttribute("class").indexOf("fixture-name") > -1) {
        this.classList.toggle("clicked");
        RaiseFixtureSelectedEvent(this.dataset.fixture);
      }
    }
  });
}
