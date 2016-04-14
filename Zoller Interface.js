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
// *
// |**********************************************************************;

//  ____ ___ ____ ____ ___    _ _ _ ____ ___     ____ ____ ____ _  _ _ ____ ____    ____ ___   _ ____ ____ ___ ____ 
//  [__   |  |__| |__/  |     | | | |___ |__]    [__  |___ |__/ |  | | |    |___    |  | |__]  | |___ |     |  [__  
//  ___]  |  |  | |  \  |     |_|_| |___ |__]    ___] |___ |  \  \/  | |___ |___    |__| |__] _| |___ |___  |  ___] 
//                                                                                                                  

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
    nodeAdapter = this.XML.children[0].children[1].children[0];
  } else if ((typeof id) == "object") {
    this.SetXML(id);
    nodeAdapter = this.XML;
  } else {
    console.log("Invalid object type!");
  }

  this.AdapterId = getValue(nodeAdapter, "AdapterId");
  this.Name = getValue(nodeAdapter, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.Type = getValue(nodeAdapter, "AdapterType");

  this.Images = [];

  var graphicSuffixes = ["", "2", "3", "4", "5", "6", "7", "8"]; // Graphic suffixes
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
    nodeMachine = this.XML.children[0].children[1].children[0];
  } else if ((typeof id) == "object") {
    this.SetXML(id);
    nodeMachine = this.XML;
  } else {
    console.log("Invalid object type!");
  }


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

  var graphicSuffixes = ["", "2", "3", "4", "5", "6", "7", "8"]; // Graphic suffixes
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
    nodeSettingSheet = this.XML.children[0].children[1].children[0];
  } else if ((typeof id) == "object") {
    this.SetXML(id);
    nodeSettingSheet = this.XML;
  } else {
    console.log("Invalid object type!");
  }

  this.SettingSheetId = getValue(nodeSettingSheet, "SettingSheetId");
  this.Name = getValue(nodeSettingSheet, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.WorkStep = getValue(nodeSettingSheet, "WorkStep");

  this.Images = [];
  this.Tools = [];
  this.Documents = [];
  this.Machine;

  var graphicSuffixes = ["", "2", "3", "4", "5", "6", "7", "8"]; // Graphic suffixes
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

  this.AddTool = function (tool) {
    // Find the tool list
    var blnAdded = false;
    if (getNodes(this.XML, "ToolList").length > 0) {
      var tlList, tlInList, tlNode, tlRef, tlPos;
      tlList = getNodes(this.XML, "ToolList")[0];
      if (this.Tools.length > 0) {
        tlList.innerHTML = "";
        for (var len = this.Tools.length, n = 0; n < len; n++) {
          tlInList = this.XML.createElement("ToolInList");
          tlNode = this.XML.createElement("Tool");
          tlRef = this.XML.createElement("ToolId");
          tlPos = this.XML.createElement("Position");
          tlPos.innerHTML = n;
          tlRef.innerHTML = this.Tools[n].ToolId;
          tlNode.appendChild(tlRef);
          tlInList.appendChild(tlPos);
          tlInList.appendChild(tlNode);
          tlList.appendChild(tlInList);
        }
      }
      tlInList = this.XML.createElement("ToolInList"); // ToolList/ToolInList
      tlNode = this.XML.createElement("Tool"); // ToolList/ToolInList/Tool
      tlRef = this.XML.createElement("ToolId"); // ToolList/ToolInList/Tool/ToolId
      tlPos = this.XML.createElement("Position"); // ToolList/ToolInList/Position
      tlPos.innerHTML = this.Tools.length + 1;
      tlRef.innerHTML = tool.ToolId;
      tlNode.appendChild(tlRef);
      tlInList.appendChild(tlPos);
      tlInList.appendChild(tlNode);
      tlList.appendChild(tlInList);
      blnAdded = true;
    }
    if (blnAdded) {
      // Send Update request with new data and avoid accidentall leaving out data
      _WebRequest("PUT", "SettingSheet/" + this.SettingSheetId + "?overwriteAll=false", function (xml) {
        console.log("Update response: ", xml);
      }, _XMLDeclaration + "<Data>" + decodeURI(this.XML.children[0].children[1].innerHTML) + "</Data>");
    } else {
      console.log("Tool XML Structure not added to Setting Sheet.");
    }
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
    nodeTool = this.XML.children[0].children[1].children[0];
  } else if ((typeof id) == "object") {
    this.SetXML(id);
    nodeTool = this.XML;
  } else {
    console.log("Invalid object type!");
  }

  this.ToolId = getValue(nodeTool, "ToolId");
  this.Description = getValue(nodeTool, "Description");// Grabbing the global value is okay because it only returns the first instance of the object

  this.CharacteristicStructures = [];
  this.Images = [];
  this.SingleComponents = [];
  this.Accessories = [];
  this.Documents = [];

  var graphicSuffixes = ["", "2", "3", "4", "5", "6", "7", "8"]; // Graphic suffixes
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
  this.SVG = getValue(this.XML, "ScalableVectorGraphic");

  this.AddComponent = function (component) {
    // Find the tool list
    var blnAdded = false;
    if (getNodes(this.XML, "ComponentList").length > 0) {
      var tlList, tlInList, tlNode, tlRef, tlPos;
      tlList = getNodes(this.XML, "ComponentList")[0];
      if (this.Components.length > 0) {
        tlList.innerHTML = "";
        for (var len = this.Components.length, n = 0; n < len; n++) {
          tlInList = this.XML.createElement("ComponentInList");
          tlNode = this.XML.createElement("Component");
          tlRef = this.XML.createElement("ComponentId");
          tlPos = this.XML.createElement("Position");
          tlPos.innerHTML = n;
          tlRef.innerHTML = this.Components[n].ComponentId;
          tlNode.appendChild(tlRef);
          tlInList.appendChild(tlPos);
          tlInList.appendChild(tlNode);
          tlList.appendChild(tlInList);
        }
      }
      tlInList = this.XML.createElement("ComponentInList"); // ComponentList/ComponentInList
      tlNode = this.XML.createElement("Component"); // ComponentList/ComponentInList/Component
      tlRef = this.XML.createElement("ComponentId"); // ComponentList/ComponentInList/Component/ComponentId
      tlPos = this.XML.createElement("Position"); // ComponentList/ComponentInList/Position
      tlPos.innerHTML = this.Components.length + 1;
      tlRef.innerHTML = component.ComponentId;
      tlNode.appendChild(tlRef);
      tlInList.appendChild(tlPos);
      tlInList.appendChild(tlNode);
      tlList.appendChild(tlInList);
      blnAdded = true;
    }
    if (blnAdded) {
      // Send Update request with new data and avoid accidentall leaving out data
      _WebRequest("PUT", "Tool/" + this.ToolId + "?overwriteAll=false", function (xml) {
        console.log("Update response: ", xml);
      }, _XMLDeclaration + "<Data>" + decodeURI(this.XML.children[0].children[1].innerHTML) + "</Data>");
    } else {
      console.log("Component XML Structure not added to Tool.");
    }
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
    nodeComponent = this.XML.children[0].children[1].children[0];
  } else if ((typeof id) == "object") {
    this.SetXML(id);
    nodeComponent = this.XML;
  } else {
    console.log("Invalid object type!");
  }

  this.ComponentId = getValue(nodeComponent, "ComponentId");

  this.Description = getValue(nodeComponent, "Description");

  this.CharacteristicStructures = [];
  this.Images = [];
  this.Accessories = [];
  this.Documents = [];

  var graphicSuffixes = ["", "2", "3", "4", "5", "6", "7", "8"]; // Graphic suffixes
  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeComponent.children.length, n = 0; n < len; n++) {
    console.log("Main Tag Name: ", nodeComponent.children[n].tagName);
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
  this.SVG = getValue(this.XML, "ScalableVectorGraphic");
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
    nodeAccessory = this.XML.children[0].children[1].children[0];
  } else if ((typeof id) == "object") {
    this.SetXML(id);
    nodeAccessory = this.XML;
  } else {
    console.log("Invalid object type!");
  }

  this.AccessoryId = getValue(nodeAccessory, "AccessoryId");

  this.Description = getValue(nodeAccessory, "Description");

}

//  ____ _  _ ___     _ _ _ ____ ___     ____ ____ ____ _  _ _ ____ ____    ____ ___   _ ____ ____ ___ ____ 
//  |___ |\ | |  \    | | | |___ |__]    [__  |___ |__/ |  | | |    |___    |  | |__]  | |___ |     |  [__  
//  |___ | \| |__/    |_|_| |___ |__]    ___] |___ |  \  \/  | |___ |___    |__| |__] _| |___ |___  |  ___] 
//                                                                                                          


//  ____ ___ ____ ____ ___    _  _ _  _ _       ____ ___   _ ____ ____ ___ ____ 
//  [__   |  |__| |__/  |      \/  |\/| |       |  | |__]  | |___ |     |  [__  
//  ___]  |  |  | |  \  |     _/\_ |  | |___    |__| |__] _| |___ |___  |  ___] 
//                                                                              

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
    this.Characteristics.push(new ZollerCharacteristicItem(xml.children[n]));
  }
}

function ZollerCharacteristicItem(xml) {
  //console.log(xml);
  this.Id = xml.tagName;
  this.Label = "";
  this.Value = xml.innerHTML;
}

//  ____ _  _ ___     _  _ _  _ _       ____ ___   _ ____ ____ ___ ____ 
//  |___ |\ | |  \     \/  |\/| |       |  | |__]  | |___ |     |  [__  
//  |___ | \| |__/    _/\_ |  | |___    |__| |__] _| |___ |___  |  ___] 
//                                                                      


//  _ _  _ ____ ____ ____    ____ ___   _ ____ ____ ___ 
//  | |\/| |__| | __ |___    |  | |__]  | |___ |     |  
//  | |  | |  | |__] |___    |__| |__] _| |___ |___  |  
//                                                      

function ZollerGraphicImage(file, group) {
  this.FileName = file;
  this.GraphicGroup = group;
  this.ImageURL = _WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName;
}


//  _  _ _  _ _       _  _ ____ _    ___  ____ ____ ____ 
//   \/  |\/| |       |__| |___ |    |__] |___ |__/ [__  
//  _/\_ |  | |___    |  | |___ |___ |    |___ |  \ ___] 
//                                                       

function getValue(xml, name) {
  if (checkNodes(xml, name)) {
    return getNodes(xml, name)[0].innerHTML;
  } else {
    return undefined;
  }
}
function getNodes(xml, name) {
  if (checkNodes(xml, name)) {
    return xml.getElementsByTagName(name);
  } else {
    return undefined;
  }
}
function checkNodes(xml, name) {
  return (xml.getElementsByTagName(name).length > 0);
}


//  _ _ _ ____ ___     ____ ____ ____ _  _ ____ ____ ___ 
//  | | | |___ |__]    |__/ |___ |  | |  | |___ [__   |  
//  |_|_| |___ |__]    |  \ |___ |_\| |__| |___ ___]  |  
//                                                       

var _XMLDeclaration = "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>";

var _RequestBaseURL = "http://server:8086/UpdateSetupSheet.asmx/SetZoller";
var _WebServiceBaseURL = "http://server:8084/ZollerDbService/";
function _WebRequest(method, query, callback, data) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", _RequestBaseURL, false);

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
