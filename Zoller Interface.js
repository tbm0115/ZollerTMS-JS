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
var _AllowEdit = false;
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

	this.IsTrueZoller = true;
	
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

	this.IsTrueZoller = true;

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

	this.IsTrueZoller = true;
	
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
  this.DrawHTML = function (size, theme, parent, overwrite) {
    var ass = document.createElement("div");
    ass.setAttribute("class", "assembly assembly-" + size + " theme-" + theme);

    var divName = document.createElement("div");
    divName.setAttribute("class", "assembly-name");
    divName.setAttribute("data-tool", this.ToolId);
    divName.onclick = function () {
      this.classList.toggle("clicked");
    }
    var divId = document.createElement("span");
    divId.setAttribute("class", "id");
    divId.innerHTML = this.ToolId;
    divId.setAttribute("title", "Tool Id: " + this.ToolId);
    divName.appendChild(divId);

    if (this.SingleComponents.length > 0) {
      var divCnt = document.createElement("span");
      divCnt.setAttribute("class", "childcount");
      divCnt.innerHTML = this.SingleComponents.length;
      divName.appendChild(divCnt);
    }

    var pName = document.createElement("p");
    pName.setAttribute("title", this.Description);
    pName.innerHTML = this.Description;
    divName.appendChild(pName);

    var imgName = document.createElement("img");
    if (this.Images.length > 0) {
      imgName.src = this.Images[0].ImageURL;
    }
    divName.appendChild(imgName);

    if (!this.IsTrueZoller) {
      if (_AllowEdit) { // Determines if the page allows the 'delete' functions to be added.
        var delName = document.createElement("a");
        delName.setAttribute("class", "delete");
        divName.appendChild(delName);
      }
    } else {
      var zolIcon = document.createElement("span");
      zolIcon.setAttribute("class", "zollerLock");
      zolIcon.setAttribute("title", "This item is managed through Zoller TMS and relevant data cannot be edited.")
      zolIcon.onclick = function (e) {
        MessageBox.Show("This is a tool assembly managed by Zoller TMS. The tool can only be modified or removed from the Setup Sheet via the Zoller TMS interface.",
          "Tool Locked", MessageBox.BoxType.Okay, "info", undefined);
        e.preventDefault();
      }
      divName.appendChild(zolIcon);
    }

    if (_AllowEdit) { // Determines if the page allows the 'add component' functions to be added.
      if (!this.IsTrueZoller) {
        var btnName = document.createElement("a");
        //btnName.setAttribute("type", "button");
        btnName.setAttribute("class", "add-component");
        divName.appendChild(btnName);
      }
    }

    if (this.Accessories.length > 0) {
      // Draw drop-down button for sub-fixtures
      var toolAccCount = document.createElement("span");
      toolAccCount.setAttribute("class", "accessorycount");
      var toolAccDropCount = document.createElement("a");
      toolAccDropCount.setAttribute("class", "flip-item");
      toolAccCount.appendChild(toolAccDropCount);
      toolAccCount.innerHTML += this.Accessories.length;
      divName.appendChild(toolAccCount);
    }

    ass.appendChild(divName);

    for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
      var divItem = document.createElement("div");
      divItem.setAttribute("class", "assembly-item");
      divItem.setAttribute("data-tool", this.ToolId);
      divItem.setAttribute("data-component", this.SingleComponents[n].ComponentId);
      divItem.setAttribute("draggable", _AllowEdit); // Only draggable if the page allows editing.
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
      if (_AllowEdit) { // Determines if the page allows the 'delete' functions to be added to the component.
        if (!this.IsTrueZoller) {
          var delItem = document.createElement("a");
          delItem.setAttribute("class", "delete");
          divItem.appendChild(delItem);
        }
      }

      ass.appendChild(divItem);
    }

    if (this.Accessories.length > 0) {
      // Draw accessories
      var toolCol4 = document.createElement("div");
      toolCol4.setAttribute("class", "accessory-sub");
      for (var len = this.Accessories.length, n = 0; n < len; n++) {
        toolCol4.appendChild(this.Accessories[n].DrawHTML("sm", theme))
      }
      ass.appendChild(toolCol4);
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
    }
    return ass;
  }

  this.Notes = ""; // Custom property
  this.IsTrueZoller = false; // Custom property

  // This function can be altered to generate a custom XML structure to store Tool assemblies in non-Zoller storage. It is important that this is defined before SetXML() to avoid an undefined function.
  this.GetXML = function () {
    var out = "<Assembly id=\"" + this.ToolId + "\" name=\"" + this.Description.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\" iszoller=\"" + this.IsTrueZoller + "\">";
    if (this.SingleComponents != undefined) {
      for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
        out += "<Tool id=\"" + this.SingleComponents[n].ComponentId + "\">";
        for (a = 0; a < this.SingleComponents[n].CharacteristicStructures.length; a++) {
          if (this.SingleComponents[n].CharacteristicStructures[a].System == "SSS") {
            for (b = 0; b < this.SingleComponents[n].CharacteristicStructures[a].Characteristics.length; b++) {
              out += "<Characteristic label=\"" + this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Label.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\">";
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
    // Get Accessories of the Single Component
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
    // Get Documents of the Single Component
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

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.AccessoryId + "\",";
    out += "\"Notes\":\"" + ((this.Notes != undefined) ? this.Notes.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"," : "\",");
    out += "}";
    return out;
  }
	
  this.DrawHTML = function (size, theme, parent, overwrite) {
    var divMain = document.createElement("div");
    divMain.setAttribute("class", "accessory accessory-" + size + " theme-" + theme);
    divMain.setAttribute("data-accessory", this.AccessoryId);

    var divName = document.createElement("div");
    divName.setAttribute("class", "accessory-name");

    var pId = document.createElement("sup");
    pId.innerHTML = this.AccessoryId;
    divName.appendChild(pId);

    var pDescription = document.createElement("p");
    pDescription.innerHTML = this.Description;
    divName.appendChild(pDescription);

    var imgName = document.createElement("img");
    if (this.Image != undefined && typeof this.Image != "undefined") {
      imgName.src = this.Image.ImageURL;
    }
    divName.appendChild(imgName);

    // Draw Zoller lock if applicable
		if (_AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
			var delName = document.createElement("a");
			delName.setAttribute("class", "delete");
			divName.appendChild(delName);
		}
		
    var divDetails = document.createElement("div");
    divDetails.setAttribute("class", "accessory-item");

    var lbl = document.createElement("label");
    lbl.innerHTML = "Standard";
    var txt = document.createElement("input");
    txt.setAttribute("type", "text");
    txt.disabled = true;
    txt.value = this.Standard;
    divDetails.appendChild(lbl);
    divDetails.appendChild(txt);

    var lbl = document.createElement("label");
    lbl.innerHTML = "Lifetime";
    var txt = document.createElement("input");
    txt.setAttribute("type", "text");
    txt.disabled = true;
    txt.value = this.Lifetime;
    divDetails.appendChild(lbl);
    divDetails.appendChild(txt);

    var lbl = document.createElement("label");
    lbl.innerHTML = "Notes";
    var txt = document.createElement("textarea");
    txt.disabled = true;
    txt.value = this.LongComment;
    divDetails.appendChild(lbl);
    divDetails.appendChild(txt);

    divMain.appendChild(divName);
    divMain.appendChild(divDetails);

    if (typeof parent !== "undefined" && parent !== undefined) {
      if (overwrite !== undefined || overwrite == false) {
        var ex = parent.querySelector("[data-accessory='" + this.AccessoryId + "']").parentElement;
        if (ex !== undefined) {
          parent.insertBefore(divMain, ex);
          parent.removeChild(ex);
        } else {
          parent.appendChild(divMain);
        }
        setHandlers();
      } else {
        parent.appendChild(divMain);
        setHandlers();
      }
    }
    return divMain;
  }

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

	this.IsTrueZoller = true;
	this.CanDelete = false;
	
  this.Description = getValue(nodeAccessory, "Description");
  this.LongComment = convertToPlain(getValue(nodeAccessory, "LongComment"));
  this.Standard = getValue(nodeAccessory, "Norm");
  this.Lifetime = getValue(nodeAccessory, "Lifetime");
  this.Image = new ZollerGraphicImage(getValue(nodeAccessory, "GraphicFile"), getValue(nodeAccessory, "GraphicGroup"));
  this.Documents = [];


  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeAccessory.children.length, n = 0; n < len; n++) {
    // Get Documents of the Tool
    if (nodeAccessory.children[n].tagName == "ExternalDocument") {
      var cmpnts = getNodes(nodeAccessory.children[n], "Document");
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

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.FixtureId + "\",";
    out += "\"Notes\":\"" + ((this.Notes != undefined) ? this.Notes.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"," : "\",");
    out += "\"PalletJawNo\":\"" + ((this.PalletJawNo != undefined) ? this.PalletJawNo.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"," : "\",");
    out += "\"ClampingPressure\":\"" + ((this.ClampingPressure != undefined) ? this.ClampingPressure.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"," : "\",");
    out += "\"ClampingDiagram\":\"" + ((this.ClampingDiagram != undefined) ? this.ClampingDiagram.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"," : "\",");
    out += "\"Remark\":\"" + ((this.Remakr != undefined) ? this.Remark.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"" : "\"");
    out += "}";
    return out;
  }

  this.DrawHTML = function (size, theme, parent, overwrite) {
    var fixt = document.createElement("div");
    fixt.setAttribute("class", "fixture fixture-" + size + " theme-" + theme);
    fixt.setAttribute("data-fixture", this.FixtureId);
    var fixtCol1 = document.createElement("div");
    fixtCol1.setAttribute("class", "fixture-name");
    var fixtName = document.createElement("p");
    fixtName.innerHTML = "<sup>(" + this.FixtureId + ")</sup> " + this.Description;
    fixtCol1.appendChild(fixtName);
    var fixtImg = document.createElement("img");
    if (this.Image != undefined && typeof this.Image != "undefined") {
      fixtImg.src = this.Image.ImageURL;
    }
    // Check for drop downs
    if (this.Fixtures.length > 0) {
      // Draw drop-down button for sub-fixtures
      var fixtSubCount = document.createElement("span");
      fixtSubCount.setAttribute("class", "childcount");
      var fixtSubDropCount = document.createElement("a");
      fixtSubDropCount.setAttribute("class", "flip-item");
      fixtSubCount.appendChild(fixtSubDropCount);
      fixtSubCount.innerHTML += this.Fixtures.length;
      fixtCol1.appendChild(fixtSubCount);
    }
    if (this.Accessories.length > 0) {
      // Draw drop-down button for sub-fixtures
      var fixtAccCount = document.createElement("span");
      fixtAccCount.setAttribute("class", "accessorycount");
      var fixtAccDropCount = document.createElement("a");
      fixtAccDropCount.setAttribute("class", "flip-item");
      fixtAccCount.appendChild(fixtAccDropCount);
      fixtAccCount.innerHTML += this.Accessories.length;
      fixtCol1.appendChild(fixtAccCount);
    }
    fixtCol1.appendChild(fixtImg);

    // Draw Notes
    var fixtCol2 = document.createElement("div");
    fixtCol2.setAttribute("class", "fixture-item");
    var fixtNotes = document.createElement("textarea");
    fixtNotes.disabled = true;
    if (this.Notes != undefined && this.Notes != "") {
      fixtNotes.value = this.Notes;
    } else if (this.LongComment != undefined && this.LongComment != "") {
      fixtNotes.value = "[Zoller Comment] " + this.LongComment;
    } else if (this.ClampingDescription != undefined && this.ClampingDescription != "") {
      fixtNotes.value = "[Zoller Clamping] " + this.ClampingDescription;
    }
    fixtCol2.appendChild(fixtNotes);

    // Draw Zoller lock if applicable
		if (_AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
			var delName = document.createElement("a");
			delName.setAttribute("class", "delete");
			fixtCol1.appendChild(delName);
		}
    

    fixt.appendChild(fixtCol1);
    fixt.appendChild(fixtCol2);

    // Add current instance of a fixture has sub fixtures, then add the HTML
    if (this.Fixtures.length > 0) {
      // Draw sub-fixtures
      var fixtCol3 = document.createElement("div");
      fixtCol3.setAttribute("class", "fixture-sub");
      for (var len = this.Fixtures.length, n = 0; n < len; n++) {
        fixtCol3.appendChild(this.Fixtures[n].DrawHTML("sm", theme))
      }
      fixt.appendChild(fixtCol3);
      fixt.innerHTML += "<hr/>";
    }

    if (this.Accessories.length > 0) {
      // Draw accessories
      var fixtCol4 = document.createElement("div");
      fixtCol4.setAttribute("class", "accessory-sub");
      for (var len = this.Accessories.length, n = 0; n < len; n++) {
        fixtCol4.appendChild(this.Accessories[n].DrawHTML("sm", theme))
      }
      fixt.appendChild(fixtCol4);
    }

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
    }
    return fixt;
  }

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

	this.IsTrueZoller = true;
	this.CanDelete = false;
	
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
  this.Fixtures = [];
  this.Accessories = [];
  this.Documents = [];

  this.Notes = ""; // Custom property
  this.PalletJawNo = ""; // Custom property
  this.ClampingPressure = ""; // Custom property
  this.ClampingDiagram = ""; // Custom property
  this.Remark = ""; // Custom property

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeFixture.children.length, n = 0; n < len; n++) {
    // Get Components and Accessories of the Fixture
    if (nodeFixture.children[n].tagName == "Article") {
      cmpnts = getNodes(nodeFixture.children[n], "Accessory");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No accessories found in Article Data");
      }
    }
    // Get Documents of the Fixture
    if (nodeFixture.children[n].tagName == "ExternalDocument") {
      var cmpnts = getNodes(nodeFixture.children[n], "Document");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No documents found in ExternalDocument Data");
      }
    }
    if (nodeFixture.children[n].tagName == "FixtureSubList") {
      var subfixts = getNodes(nodeFixture.children[n], "Fixture");
      for (var flen = subfixts.length, m = 0; m < flen; m++) {
        var fid = getValue(subfixts[m], "FixtureId");
        if (fid != undefined && typeof fid != "undefined") {
          var nwFixture = new ZollerFixture(fid);
					this.Fixtures.push(nwFixture);
        }
      }
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

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.MeasuringDeviceId + "\",";
    out += "\"Notes\":\"" + ((this.Notes != undefined) ? this.Notes.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"" : "\"");
    out += "}";
    return out;
  }

  this.DrawHTML = function (size, theme, parent, overwrite) {
    var meas = document.createElement("div");
    meas.setAttribute("class", "measure measure-" + size + " theme-" + theme);
    meas.setAttribute("data-measure", this.MeasuringDeviceId);
    var measCol1 = document.createElement("div");
    measCol1.setAttribute("class", "measure-name");

    var measName = document.createElement("p");
    measName.innerHTML = "<sup>(" + this.MeasuringDeviceId + ")</sup> " + this.Description;
    measCol1.appendChild(measName);
    var imgName = document.createElement("img");
    if (this.Images.length > 0) {
      imgName.src = this.Images[0].ImageURL;
    }
    measName.appendChild(imgName);
    // Check for drop downs
    if (this.Accessories.length > 0) {
      // Draw drop-down button for sub-fixtures
      var measAccCount = document.createElement("span");
      measAccCount.setAttribute("class", "accessorycount");
      var measAccDropCount = document.createElement("a");
      measAccDropCount.setAttribute("class", "flip-item");
      measAccCount.appendChild(measAccDropCount);
      measAccCount.innerHTML += this.Accessories.length;
      measCol1.appendChild(measAccCount);
    }

    // Draw Notes
    var measCol2 = document.createElement("div");
    measCol2.setAttribute("class", "fixture-item");
    var measNotes = document.createElement("textarea");
    measNotes.disabled = true;
    if (this.Notes != undefined && this.Notes != "") {
      measNotes.value = this.Notes;
    } else if (this.LongComment != undefined && this.LongComment != "") {
      measNotes.value = "[Zoller Comment] " + this.LongComment;
    }
    measCol2.appendChild(measNotes);

		if (_AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
			var delName = document.createElement("a");
			delName.setAttribute("class", "delete");
			measCol1.appendChild(delName);
		}
    

    meas.appendChild(measCol1);
    meas.appendChild(measCol2);

    if (this.Accessories.length > 0) {
      // Draw accessories
      var measCol3 = document.createElement("div");
      measCol3.setAttribute("class", "accessory-sub");
      for (var len = this.Accessories.length, n = 0; n < len; n++) {
        measCol3.appendChild(this.Accessories[n].DrawHTML("sm", theme))
      }
      meas.appendChild(measCol3);
    }

    if (typeof parent !== "undefined" && parent !== undefined) {
      if (overwrite !== undefined || overwrite == false) {
        var ex = parent.querySelector("[data-measure='" + this.MeasuringDeviceId + "']").parentElement;
        if (ex !== undefined) {
          parent.insertBefore(meas, ex);
          parent.removeChild(ex);
        } else {
          parent.appendChild(meas);
        }
        setHandlers();
      } else {
        parent.appendChild(meas);
        setHandlers();
      }
    }
    return meas;
  }

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

	this.IsTrueZoller = true;
	this.CanDelete = false;
	
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
  this.Images = [];
  this.Accessories = [];
  this.Documents = [];

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeMeasuringDevice.children.length, n = 0; n < len; n++) {
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = graphicSuffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeMeasuringDevice.children[n].tagName == "GraphicFile" + graphicSuffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeMeasuringDevice.children[n].innerHTML, nodeMeasuringDevice.children[n + 1].innerHTML));
      }
    }
    // Get Components and Accessories of the Measuring Device
    if (nodeMeasuringDevice.children[n].tagName == "Article") {
      cmpnts = getNodes(nodeMeasuringDevice.children[n], "Accessory");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
        }
      } else {
        console.log("No accessories found in Article Data");
      }
    }
    // Get Documents of the Measuring Device
    if (nodeMeasuringDevice.children[n].tagName == "ExternalDocument") {
      var cmpnts = getNodes(nodeMeasuringDevice.children[n], "Document");
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

	this.IsTrueZoller = true;
	
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
    if (this.GraphicGroup != undefined && this.FileName != undefined && typeof this.GraphicGroup != "undefined" && typeof this.FileName != "undefined") {
      return _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + width + "&h=" + height;
    } else {
      return ""
    }

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
//     Defines the URI for the Zoller Web Service. Typically 
//     http://[servername]:80/ZollerDbService/
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
    if (xhr.readyState == 4) {// && xhr.status == 200){
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

function RaiseAccessoryDeleteEvent(Accessory) {
  var evt = document.createEvent("Events");
  evt.initEvent("accessorydelete", true, true);
  evt.AccessoryId = Accessory;
  document.dispatchEvent(evt);
}
function RaiseMeasureDeleteEvent(Measuring) {
  var evt = document.createEvent("Events");
  evt.initEvent("measuredelete", true, true);
  evt.MeasuringDeviceId = Measuring;
  document.dispatchEvent(evt);
}
function RaiseFixtureDeleteEvent(Fixture) {
  var evt = document.createEvent("Events");
  evt.initEvent("fixturedelete", true, true);
  evt.FixtureId = Fixture;
  document.dispatchEvent(evt);
}
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
function RaiseAccessorySelectedEvent(Accessory) {
  var evt = document.createEvent("Events");
  evt.initEvent("accessoryselected", true, true);
  evt.AccessoryId = Accessory;
  document.dispatchEvent(evt);
}
function RaiseMeasuringSelectedEvent(Measure) {
  var evt = document.createEvent("Events");
  evt.initEvent("measureselected", true, true);
  evt.MeasuringDeviceId = Measure;
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
	e.stopImmediatePropagation();
  e.preventDefault();
}
function deleteTool(e) {
  RaiseToolDeleteEvent(e.target.parentElement.dataset.tool);
	e.stopImmediatePropagation();
  e.preventDefault();
}
function deleteFixture(e) {
  RaiseFixtureDeleteEvent(e.target.parentElement.parentElement.dataset.fixture);
	e.stopImmediatePropagation();
  e.preventDefault();
}
function deleteMeasuring(e) {
	RaiseMeasureDeleteEvent(e.target.parentElement.parentElement.dataset.measure);
	e.stopImmediatePropagation();
	e.preventDefault();
}
function deleteAccessory(e) {
	RaiseAccessoryDeleteEvent(e.target.parentElement.parentElement.dataset.accessory);
	e.stopImmediatePropagation();
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

function GetParentWithClass(name,el,limit){
	var cur = el;
	for (var len = limit, n = 0; n < len; n++){
		if (cur.getAttribute("class") != null){
			if (cur.getAttribute("class").indexOf(name) > -1){
				return cur
			}
		}
		cur = cur.parentElement;
	}
}
function setHandlers() {
	// Main Node click
	setHandler(".assembly-name", "click", function (e) {
		if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("assembly-name") > -1) {
			e.target.classList.toggle("clicked");
			RaiseToolSelectedEvent(e.target.dataset.tool);
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
	setHandler(".fixture-name", "click", function (e) {
		var el = GetParentWithClass("fixture-name",e.target,3);
		if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("fixture-name") > -1) {
			RaiseFixtureSelectedEvent(el.parentElement.dataset.fixture);
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
	setHandler(".measure-name", "click", function (e) {
		var el = GetParentWithClass("measure-name",e.target,3);
		if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("measure-name") > -1) {
			RaiseMeasuringSelectedEvent(el.parentElement.dataset.measure);
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
	setHandler(".accessory-name", "click", function (e) {
		var el = GetParentWithClass("accessory-name",e.target,3);
		if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("accessory-name") > -1) {
			RaiseAccessorySelectedEvent(el.parentElement.dataset.accessory);
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
	
	// Drag events
	setHandler(".assembly-item", "dragstart", handleDragStart);
	setHandler(".assembly-item", "dragenter", handleDragEnter);
	setHandler(".assembly-item", "dragover", handleDragOver);
	setHandler(".assembly-item", "dragleave", handleDragLeave);
	setHandler(".assembly-item", "drop", handleDrop);
	setHandler(".assembly-item", "dragend", handleDragEnd);
	setHandler(".assembly-item", "click", selectedComponent);
  setHandler(".assembly-item > .delete", "click", deleteComponent);
  setHandler(".assembly-name > .delete", "click", deleteTool);
  
	// Delete events
	setHandler(".fixture-name > .delete", "click", deleteFixture);
  setHandler(".measure-name > .delete", "click", deleteMeasuring);
	setHandler(".accessory-name > .delete", "click", deleteAccessory);
	
	// Add component
  setHandler(".add-component","click",function (e) {
		RaiseComponentAddEvent(e.target.parentElement.dataset.tool)
		e.stopImmediatePropagation();
		e.preventDefault();
	});
  
	// Flip button events
  setHandler(".assembly-name > .accessorycount > .flip-item", "click", function (e) {
		var blnGood = false;
		if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
			blnGood = true;
		}
		if (blnGood){
			var parTool = e.target.parentElement.parentElement.parentElement;
			var subAccDiv = parTool.querySelector(".accessory-sub");
			var closing = subAccDiv.classList.contains("show");
			subAccDiv.classList.toggle("show");
			var count = subAccDiv.querySelectorAll(".fixture").length;
			if (parTool.style.getPropertyValue("height") != "" && parTool.querySelector(".show") == null) {
				parTool.style.removeProperty("height");
			} else {
				//parFixt.style.height = "auto";
				if (closing) {
					parTool.style.height = "calc(" + (parTool.clientHeight * count) + "px - var(--sizeHeight))";
				} else {
					parTool.style.height = "calc(var(--sizeHeight) + " + (parTool.clientHeight * count) + "px)";
				}
			}
			e.target.classList.toggle("flipped");
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
  setHandler(".fixture-name > .childcount > .flip-item", "click", function (e) {
		var blnGood = false;
		if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
			blnGood = true;
		}
		if (blnGood){
			var parFixt = e.target.parentElement.parentElement.parentElement;
			var subFixtDiv = parFixt.querySelector(".fixture-sub");
			var closing = subFixtDiv.classList.contains("show");
			subFixtDiv.classList.toggle("show");
			var count = subFixtDiv.querySelectorAll(".fixture").length;
			if (parFixt.style.getPropertyValue("height") != "" && parFixt.querySelector(".show") == null) {
				parFixt.style.removeProperty("height");
			} else {
				//parFixt.style.height = "auto";
				if (closing) {
					parFixt.style.height = "calc(" + (parFixt.clientHeight * count) + "px - var(--sizeHeight))";
				} else {
					parFixt.style.height = "calc(var(--sizeHeight) + " + (parFixt.clientHeight * count) + "px)";
				}
			}
			e.target.classList.toggle("flipped");
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
  setHandler(".fixture-name > .accessorycount > .flip-item", "click", function (e) {
		var blnGood = false;
		if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
			blnGood = true;
		}
		if (blnGood){
			var parFixt = e.target.parentElement.parentElement.parentElement;
			var subAccDiv = parFixt.querySelector(".accessory-sub");
			var closing = subAccDiv.classList.contains("show");
			subAccDiv.classList.toggle("show");
			var count = subAccDiv.querySelectorAll(".accessory").length;
			if (parFixt.style.getPropertyValue("height") != "" && parFixt.querySelector(".show") == null) {
				parFixt.style.removeProperty("height");
			} else {
				//parFixt.style.height = "auto";
				if (closing) {
					parFixt.style.height = "calc(" + (parFixt.clientHeight * count) + "px - var(--sizeHeight))";
				} else {
					parFixt.style.height = "calc(var(--sizeHeight) + " + (parFixt.clientHeight * count) + "px + 15px)";
				}
			}
			e.target.classList.toggle("flipped");
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
  setHandler(".measure-name > .accessorycount > .flip-item", "click", function (e) {
		var blnGood = false;
		if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
			blnGood = true;
		}
		if (blnGood){
			var parMeas = e.target.parentElement.parentElement.parentElement;
			var subAccDiv = parMeas.querySelector(".accessory-sub");
			var closing = subAccDiv.classList.contains("show");
			subAccDiv.classList.toggle("show");
			if (parMeas.style.getPropertyValue("height") != "" && parMeas.querySelector(".show") == null) {
				parMeas.style.removeProperty("height");
			} else {
				//parFixt.style.height = "auto";
				if (closing) {
					parMeas.style.height = "calc(" + parMeas.clientHeight + "px - var(--sizeHeight))";
				} else {
					parMeas.style.height = "calc(var(--sizeHeight) + " + parMeas.clientHeight + "px + 15px)";
				}
			}
			e.target.classList.toggle("flipped");
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
}
function setHandler(query,onevent,callback){
	var cols = document.querySelectorAll(query);
	for (var len = cols.length, n = 0; n < len; n++){
		cols[n].addEventListener(onevent, callback, false);
	}
}