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
	this.isNull = false;
	this.AdapterId = "";
	this.Name = "";
	this.AdapterType = "";
	this.Images = [];
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerAdapter(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeAdapter;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Adapter/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeAdapter = getNodeByTagName(this.XML, "Adapter");
	if (nodeAdapter == undefined){this.isNull = true;return undefined;}

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
  
  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeAdapter.children.length, n = 0; n < len; n++) {
    // Iterate through the main nodes first as there are more nodes than suffixes
    if (nodeAdapter.children[n].tagName == "AdapterPresetter") {
      for (var blen = nodeAdapter.children[n].children.length, k = 0; k < blen; k++) {
        for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
          // Iterate through the possible suffixes to see if the current node matches
          if (nodeAdapter.children[n].children[k].tagName == "GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) {
            this.Images.push(new ZollerGraphicImage(nodeAdapter.children[n].children[k].innerHTML, nodeAdapter.children[n].children[k + 1].innerHTML));
          }
        }
      }
    }
  }

}

function ZollerMachine(id) {
	this.isNull = false;
	this.MachineId = "";
	this.Name = "";
	this.Description = "";
	this.MagazineCapacity = "";
	this.NCToDirectory = "";
	this.NCFromDirectory = "";
	this.MachineType = "";
	this.Manufacturer = "";
	this.Images = [];
	this.Tools = [];
	this.SettingSheets = [];
	this.Accessories = [];
	this.Adapters = [];
	this.Documents = [];
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerMachine(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeMachine;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Machine/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeMachine = getNodeByTagName(this.XML, "Machine");
	if (nodeMachine == undefined){this.isNull = true;return undefined;}

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

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeMachine.children.length, n = 0; n < len; n++) {
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeMachine.children[n].tagName == "GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) {
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
	this.isNull = false;
	this.SettingSheetId = "";
	this.Name = "";
	this.WorkStep = "";
	this.Machine;
	this.Images = [];
	this.Tools = [];
	this.Fixtures = [];
	this.MeasuringDevicesV2 = [];
	this.Documents = [];
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerSettingSheet(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeSettingSheet;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "SettingSheet/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeSettingSheet = getNodeByTagName(this.XML, "SettingSheet");
	if (nodeSettingSheet == undefined){this.isNull = true;return undefined;}

	this.IsTrueZoller = true;
	
  this.SettingSheetId = getValue(nodeSettingSheet, "SettingSheetId");
  this.Name = getValue(nodeSettingSheet, "Name");// Grabbing the global value is okay because it only returns the first instance of the object
  this.WorkStep = getValue(nodeSettingSheet, "WorkStep");
  this.DatasetState = getValue(nodeSettingSheet, "DatasetState");
  this.InvMode = getValue(nodeSettingSheet, "InvMode");
  this.InvPhysical = getValue(nodeSettingSheet, "InvPhysical");
  this.InvFullCopy = getValue(nodeSettingSheet, "InvFullCopy");

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeSettingSheet.children.length, n = 0; n < len; n++) {
    // Get Machine of the SettingSheet
    if (nodeSettingSheet.children[n].tagName == "Machine") {
      this.Machine = new ZollerMachine(nodeSettingSheet.children[n]);
    }
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeSettingSheet.children[n].tagName == "GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) {
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
		// Get Fixtures of the SettingSheet
    if (nodeSettingSheet.children[n].tagName == "FixtureList") {
      var fixts = getNodes(nodeSettingSheet.children[n], "FixtureInList");
      if (fixts != undefined) {
        for (var clen = fixts.length, i = 0; i < clen; i++) {
					var fixt = new ZollerSubFixture();
					fixt.Position = getValue(fixts[i], "Position");
					fixt.Quantity = getValue(fixts[i], "Quantity");
					fixt.Fixture = new ZollerFixture(getNodeByTagName(fixts[i], "Fixture"));
					this.Fixtures.push(fixt);
        }
      } else {
        console.log("No fixtures found in FixtureList Data");
      }
    }
		// Get MeasuringDeviceV2 of the SettingSheet
    if (nodeSettingSheet.children[n].tagName == "MeasuringDeviceV2List") {
      var meass = getNodes(nodeSettingSheet.children[n], "MeasuringDeviceV2InList");
      if (meass != undefined) {
        for (var clen = meass.length, i = 0; i < clen; i++) {
					var meas = new ZollerSubMeasuringDeviceV2();
					meas.Position = getValue(meass[i], "Position");
					meas.Quantity = getValue(meass[i], "Quantity");
					meas.MeasuringDeviceV2 = new ZollerMeasuringDeviceV2(getNodeByTagName(meass[i], "MeasuringDeviceV2"));
					this.MeasuringDevicesV2.push(meas);
        }
      } else {
        console.log("No MeasuringDeviceV2 found in MeasuringDeviceV2List Data");
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
	this.isNull = false;
	this.ToolId = "";
	this.Description = "";
	this.CharacteristicStructures = [];
	this.Images = [];
	this.SingleComponents = [];
	this.Accessories = [];
	this.Documents = [];
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerTool(id);
    }
    this.Collected = false; // Custom flag determining if the tool items have been physically collected.
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
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

		if (this.SingleComponents != undefined){
			if (this.SingleComponents.length > 0) {
				var divCnt = document.createElement("span");
				divCnt.setAttribute("class", "childcount");
				divCnt.innerHTML = this.SingleComponents.length;
				divName.appendChild(divCnt);
			}
		}

    var pName = document.createElement("p");
    pName.setAttribute("title", this.Description);
    pName.innerHTML = this.Description;
    divName.appendChild(pName);

    var imgName = document.createElement("img");
		if (this.Images != undefined){
			if (this.Images.length > 0) {
				imgName.src = this.Images[0].ImageURL;
			}
		}
    divName.appendChild(imgName);

		if (ZollerGlobal.Graphics.AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
			var delName = document.createElement("a");
			delName.setAttribute("class", "delete");
			divName.appendChild(delName);
		}
    if (this.IsTrueZoller) {
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

    if (ZollerGlobal.Graphics.AllowEdit && !this.IsTrueZoller) { // Determines if the page allows the 'add component' functions to be added.
			var btnName = document.createElement("a");
			//btnName.setAttribute("type", "button");
			btnName.setAttribute("class", "add-component");
			divName.appendChild(btnName);
    }

		if (this.Accessories != undefined){
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
		}

    ass.appendChild(divName);

		if (this.SingleComponents != undefined){
			for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
				var divItem = document.createElement("div");
				divItem.setAttribute("class", "assembly-item");
				divItem.setAttribute("data-tool", this.ToolId);
				divItem.setAttribute("data-component", this.SingleComponents[n].ComponentId);
				divItem.setAttribute("draggable", ZollerGlobal.Graphics.AllowEdit); // Only draggable if the page allows editing.
				var aItem = document.createElement("a");
				var pId = document.createElement("p");
				pId.innerHTML = this.SingleComponents[n].ComponentId;
				pId.setAttribute("title", "Component Id");
				aItem.appendChild(pId);
				var pDescription = document.createElement("p");
				pDescription.innerHTML = this.SingleComponents[n].Description;
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
				if (ZollerGlobal.Graphics.AllowEdit && !this.IsTrueZoller && this.SingleComponents[n].CanDelete) { // Determines if the page allows the 'delete' functions to be added to the component.
					var delItem = document.createElement("a");
					delItem.setAttribute("class", "delete");
					divItem.appendChild(delItem);
				}

				ass.appendChild(divItem);
			}
		}

		if (this.Accessories != undefined){
			if (this.Accessories.length > 0) {
				// Draw accessories
				var toolCol4 = document.createElement("div");
				toolCol4.setAttribute("class", "accessory-sub");
				for (var len = this.Accessories.length, n = 0; n < len; n++) {
					toolCol4.appendChild(this.Accessories[n].DrawHTML("sm", theme))
				}
				ass.appendChild(toolCol4);
			}
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
        ZollerGlobal.Set.Handlers();
      } else {
        parent.appendChild(ass);
        ZollerGlobal.Set.Handlers();
      }
    }
    return ass;
  }

  this.Notes = ""; // Custom property
  this.IsTrueZoller = false; // Custom property

  // This function can be altered to generate a custom XML structure to store Tool assemblies in non-Zoller storage. It is important that this is defined before SetXML() to avoid an undefined function.
  this.GetXML = function () {
		var out = [];
		if (!this.IsTrueZoller){
			out.push("<Assembly id=\"" + this.ToolId + "\" name=\"" + this.Description.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\">");// iszoller=\"" + this.IsTrueZoller + "\"
			if (this.SingleComponents != undefined) {
				for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
					out.push("<Tool id=\"" + this.SingleComponents[n].ComponentId + "\">");
					for (a = 0; a < this.SingleComponents[n].CharacteristicStructures.length; a++) {
						if (this.SingleComponents[n].CharacteristicStructures[a].System == "SSS") {
							for (b = 0; b < this.SingleComponents[n].CharacteristicStructures[a].Characteristics.length; b++) {
								out.push("<Characteristic label=\"" + this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Label.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\">");
								out.push(this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Value + "</Characteristics>");
							}
						}
					}
					out.push("<Notes>" + this.SingleComponents[n].Notes + "</Notes>");
					out.push("</Tool>");
				}
			}
			out.push("</Assembly>");
		}
    return out.join("");
  }

  // Determine if the object is a valid Zoller object by attempting to get data from the Zoller WebService.
  var nodeTool;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Tool/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeTool = getNodeByTagName(this.XML, "Tool");
	if (nodeTool == undefined){this.isNull = true;return undefined;}

  this.IsTrueZoller = true; // Custom property
  this.Collected = false; // Custom property, flag determining if the tool items have been physically collected.

  this.ToolId = getValue(nodeTool, "ToolId");
  this.Description = getValue(nodeTool, "Description");// Grabbing the global value is okay because it only returns the first instance of the object
  this.TNo = getValue(nodeTool, "TNo");
  this.LongComment = Convert.RTFToPlainText(getValue(nodeTool, "LongComment"));
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

  this.SVG = getValue(nodeTool, "ScalableVectorGraphic");// Get the most pertinent SVG data if available.


  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeTool.children.length, n = 0; n < len; n++) {
    if (nodeTool.children[n].tagName == "Characteristic") {
      this.CharacteristicStructures.push(new ZollerCharacteristicStructure(nodeTool.children[n]));
    }
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeTool.children[n].tagName == "GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) {
        this.Images.push(new ZollerGraphicImage(nodeTool.children[n].innerHTML, nodeTool.children[n + 1].innerHTML));
      }
    }
    // Get Components and Accessories of the Tool
    if (nodeTool.children[n].tagName == "Article") {
      var cmpnts = getNodes(nodeTool.children[n], "Component");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
          this.SingleComponents.push(new ZollerSingleComponent(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					this.SingleComponents[this.SingleComponents.length-1].IsTrueZoller = true;
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
	
	this.Convert = function(newUnits){
		for (var len = this.CharacteristicStructures.length, n = 0; n < len; n++){
			for (var clen = this.CharacteristicStructures[n].length, m = 0; m < clen; m++){
				this.CharacteristicStructures[n].Characteristics[m].Convert(newUnits);
			}
		}
	}
}

function ZollerSingleComponent(id) {
	this.isNull = false;
	this.ComponentId = "";
	this.Description = "";
	this.CharacteristicStructures = [];
	this.Images = [];
	this.Accessories = [];
	this.Documents = [];
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerSingleComponent(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  // Determine if the object is a valid Zoller object by attempting to get data from the Zoller WebService.
  var nodeComponent;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Component/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeComponent = getNodeByTagName(this.XML, "Component");
	if (nodeComponent == undefined){this.isNull = true;return undefined;}

	this.IsTrueZoller = false;
	
  this.ComponentId = getValue(nodeComponent, "ComponentId");
  this.Description = getValue(nodeComponent, "Description");
  this.PartClass = getValue(nodeComponent, "PartClass");
  this.SubjectNo = getValue(nodeComponent, "SubjectNo");
  this.Norm = getValue(nodeComponent, "Norm");
  this.LongComment = Convert.RTFToPlainText(getValue(nodeComponent, "LongComment"));
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
	
  this.EDP = getValue(nodeComponent, "SubjectNo"); // Custom property
  this.OrderCode = getValue(nodeComponent, "Norm"); // Custom property
  this.Notes = ""; // Custom property

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeComponent.children.length, n = 0; n < len; n++) {
    if (nodeComponent.children[n].tagName == "Characteristic") {
      this.CharacteristicStructures.push(new ZollerCharacteristicStructure(nodeComponent.children[n]));
    }
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeComponent.children[n].tagName == "GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) {
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
	
	this.Convert = function(newUnits){
		for (var len = this.CharacteristicStructures.length, n = 0; n < len; n++){
			for (var clen = this.CharacteristicStructures[n].length, m = 0; m < clen; m++){
				this.CharacteristicStructures[n].Characteristics[m].Convert(newUnits);
			}
		}
	}
}

function ZollerAccessory(id) {
	this.isNull = false;
	this.AccessoryId = "";
	this.Description = "";
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerSettingSheet(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
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
		if (ZollerGlobal.Graphics.AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
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
        ZollerGlobal.Set.Handlers();
      } else {
        parent.appendChild(divMain);
        ZollerGlobal.Set.Handlers();
      }
    }
    return divMain;
  }

  var nodeAccessory;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Accessory/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeAccessory = getNodeByTagName(this.XML, "Accessory");
	if (nodeAccessory == undefined){this.isNull = true;return undefined;}

  this.AccessoryId = getValue(nodeAccessory, "AccessoryId");

	this.IsTrueZoller = true;
	this.CanDelete = false;
	
  this.Description = getValue(nodeAccessory, "Description");
  this.LongComment = Convert.RTFToPlainText(getValue(nodeAccessory, "LongComment"));
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
	this.isNull = false;
	this.FixtureId = "";
	this.Description = "";
  this.Fixtures = [];
  this.Accessories = [];
  this.Documents = [];
	this.CustomProperties = {};
if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerFixture(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.FixtureId + "\"";
		var props = Object.getOwnPropertyNames(this.CustomProperties);
		if (props.length > 0){
			for (var len = props.length, n = 0; n < len; n++){
				out += ",\"" + props[n] + "\":\"" + this.CustomProperties[props[n]].replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\"";
			}
		}
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

		// Draw Details panel
		if (Object.getOwnPropertyNames(this.CustomProperties)){
			var props = Object.getOwnPropertyNames(this.CustomProperties);
			if (props.length > 0){
				var fixtCol15 = document.createElement("div");
				fixtCol15.setAttribute("class", "fixture-details");
				var fixtCol15Row;
				var idx = 0;
				for (var len = props.length, n = 0; n < len; n++){
					if (this.CustomProperties[props[n]] != undefined && this.CustomProperties[props[n]] != ""){
						if (ZollerGlobal.AllowEdit){
							if (idx == 0 || idx > 1){
								if (idx > 0){
									fixtCol15.appendChild(fixtCol15Row);
								}
								fixtCol15Row = document.createElement("div");
								fixtCol15Row.setAttribute("class", "row");
								idx = 0;
							}
							var fixtCol15Col = document.createElement("div");
							fixtCol15Col.setAttribute("class", "col-lg-6 col-md-6 col-sm-6 col-xs-6");
							var lbl = document.createElement("label");
							lbl.setAttribute("class", "label label-primary");
							lbl.setAttribute("for", "txtZollerCP" + n);
							lbl.innerText = props[n];
							var txt = document.createElement("input");
							txt.setAttribute("class", "form-control");
							txt.setAttribute("value", this.CustomProperties[props[n]]);
							txt.disabled = !ZollerGlobal.AllowEdit;
							txt.id = "txtZollerCP" + n;
							fixtCol15Col.appendChild(lbl);
							fixtCol15Col.appendChild(txt);
							fixtCol15Row.appendChild(fixtCol15Col);
							idx += 1;
						}else{ // Read-Only mode, so lets compile the characteristics in the notes as HTML
							var charDiv = document.createElement("div");
							charDiv.innerHTML = "<strong><u>" + props[n] + "</u></strong>: " + this.CustomProperties[props[n]] + "<br />";
							fixtCol15.appendChild(charDiv);
						}
					}
				}
				if (fixtCol15Row != undefined){
					if (fixtCol15Row.children.length > 0){
						fixtCol15.appendChild(fixtCol15Row);
					}
				}
				if (fixtCol15.children.length == 0){ fixtCol15 = undefined }
			}
		}
		
		// Draw Notes panel
    var fixtCol2 = document.createElement("div");
    fixtCol2.setAttribute("class", "fixture-item");
    var fixtNotes = document.createElement("textarea");
    fixtNotes.disabled = true;
    if (this.LongComment != undefined && this.LongComment != "") {
      fixtNotes.value = "[Zoller Comment] " + this.LongComment;
    } else if (this.ClampingDescription != undefined && this.ClampingDescription != "") {
      fixtNotes.value = "[Zoller Clamping] " + this.ClampingDescription;
    }
    fixtCol2.appendChild(fixtNotes);

    // Draw Zoller lock if applicable
		if (ZollerGlobal.Graphics.AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
			var delName = document.createElement("a");
			delName.setAttribute("class", "delete");
			fixtCol1.appendChild(delName);
		}    

    fixt.appendChild(fixtCol1);
		if (fixtCol15 != undefined){
			fixt.appendChild(fixtCol15)
		}else{
			fixt.appendChild(fixtCol2);
		}

    // Add current instance of a fixture has sub fixtures, then add the HTML
    if (this.Fixtures.length > 0) {
      // Draw sub-fixtures
      var fixtCol3 = document.createElement("div");
      fixtCol3.setAttribute("class", "fixture-sub");
      for (var len = this.Fixtures.length, n = 0; n < len; n++) {
        fixtCol3.appendChild(this.Fixtures[n].Fixture.DrawHTML("sm", theme))
				fixtCol3.childNodes[fixtCol3.childNodes.length-1].setAttribute("data-quantity",this.Fixtures[n].Quantity);
      }
      fixt.appendChild(fixtCol3);
      //fixt.innerHTML += "<hr/>";
    }

    if (this.Accessories.length > 0) {
      // Draw accessories
      var fixtCol4 = document.createElement("div");
      fixtCol4.setAttribute("class", "accessory-sub");
      for (var len = this.Accessories.length, n = 0; n < len; n++) {
        fixtCol4.appendChild(this.Accessories[n].Accessory.DrawHTML("sm", theme))
				fixtCol4.childNodes[fixtCol4.childNodes.length-1].setAttribute("data-quantity",this.Accessories[n].Quantity);
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
        ZollerGlobal.Set.Handlers();
      } else {
        parent.appendChild(fixt);
        ZollerGlobal.Set.Handlers();
      }
    }
    return fixt;
  }

	this.DrawHTMLList = function(size, theme, parent, overwrite) {
    var fixt = document.createElement("li");
    fixt.setAttribute("class", "fixture fixture-" + size + " theme-" + theme);
    fixt.setAttribute("data-fixture", this.FixtureId);
		
		var name = document.createElement("div");
		name.innerHTML = "<sup>[" + this.FixtureId + "]</sup> " + this.Description;
		fixt.appendChild(name);
		
		
		if (this.Fixtures.length > 0){
      // Draw drop-down button for sub-fixtures
      var fixtSubCount = document.createElement("span");
      var fixtSubDropCount = document.createElement("a");
      fixtSubCount.appendChild(fixtSubDropCount);
      fixtSubCount.innerHTML += this.Fixtures.length;
			name.appendChild(fixtSubCount);
			// Add HTML List items
			var sub = document.createElement("ul");
			for(var len = this.Fixtures.length, n = 0; n < len; n++){
				sub.appendChild(this.Fixtures[n].Fixture.DrawHTMLList(size, theme));
				sub.childNodes[sub.childNodes.length-1].setAttribute("data-quantity",this.Fixtures[n].Quantity);
			}
			fixt.appendChild(sub);
		}
    // Draw Zoller lock if applicable
		if (ZollerGlobal.Graphics.AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
			var delName = document.createElement("a");
			delName.setAttribute("class", "delete");
			name.appendChild(delName);
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
        ZollerGlobal.Set.Handlers();
      } else {
        parent.appendChild(fixt);
        ZollerGlobal.Set.Handlers();
      }
    }
    return fixt;
	}
	
  var nodeFixture;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Fixture/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeFixture = getNodeByTagName(this.XML, "Fixture");
	if (nodeFixture == undefined){this.isNull = true;return undefined;}

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
  this.LongComment = Convert.RTFToPlainText(getValue(nodeFixture, "LongComment"));
  this.Image = new ZollerGraphicImage(getValue(nodeFixture, "GraphicFile"), getValue(nodeFixture, "GraphicGroup"));
  
	this.CustomProperties = {};//This is a placeholder for all custom properties

  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeFixture.children.length, n = 0; n < len; n++) {
    // Get Components and Accessories of the Fixture
    if (nodeFixture.children[n].tagName == "Article") {
      cmpnts = getNodes(nodeFixture.children[n], "AccessoryInList");
      if (cmpnts != undefined) {
        for (var clen = cmpnts.length, i = 0; i < clen; i++) {
					var aid = getValue(cmpnts[i], "AccessoryId");
					if (aid != undefined && typeof aid != "undefined"){
						var nwSubAcc = new ZollerSubAccessory();
						nwSubAcc.Position = Number(getValue(cmpnts[i], "Position"));
						nwSubAcc.Quantity = Number(getValue(cmpnts[i], "Quantity"));
						nwSubAcc.Accessory = new ZollerAccessory(aid);
						this.Accessories.push(nwSubAcc);// Send XML structure. Only captured using LoadSubData query.
					}
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
      var subfixts = getNodes(nodeFixture.children[n], "FixtureInList");
			if (subfixts.length > 0){
				for (var flen = subfixts.length, m = 0; m < flen; m++) {
					//var fixtu = getNodeByTagName(subfixts[m],"Fixture");
					var fid = getValue(subfixts[m], "FixtureId");
					if (fid != undefined && typeof fid != "undefined") {
						var nwSubFixtu = new ZollerSubFixture();
						nwSubFixtu.Position = Number(getValue(subfixts[m], "Position"));
						nwSubFixtu.Quantity = Number(getValue(subfixts[m], "Quantity"));
						nwSubFixtu.Fixture = new ZollerFixture(fid);
						this.Fixtures.push(nwSubFixtu);
					}
				}
			}
    }
  }
	// Rearrange Sub-Fixtures
	if (this.Fixtures.length > 0){
		var cntGood = 0;
		while (cntGood < this.Fixtures.length){
			cntGood = 0;
			for (var len = this.Fixtures.length, n = 0; n < len; n++){
				if (n != this.Fixtures[n].Position-1){
					this.Fixtures.move(n,this.Fixtures[n].Position-1);
				}else{
					cntGood += 1;
				}
			}
		}
	}
	// Rearrange Sub-Accessory
	if (this.Accessories.length > 0){
		var cntGood = 0;
		while (cntGood < this.Accessories.length){
			cntGood = 0;
			for (var len = this.Accessories.length, n = 0; n < len; n++){
				if (n != this.Accessories[n].Position-1){
					this.Accessories.move(n,this.Accessories[n].Position-1);
				}else{
					cntGood += 1;
				}
			}
		}
	}
}

function ZollerMeasuringDeviceV2(id) {
	this.isNull = false;
	this.MeasuringDeviceId = "";
	this.Description = "";
  this.Images = [];
  this.Accessories = [];
  this.Documents = [];
	this.CustomProperties = {};
	if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerMeasuringDeviceV2(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
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

		if (ZollerGlobal.Graphics.AllowEdit && this.CanDelete) { // Determines if the page allows the 'delete' functions to be added.
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
        ZollerGlobal.Set.Handlers();
      } else {
        parent.appendChild(meas);
        ZollerGlobal.Set.Handlers();
      }
    }
    return meas;
  }

  var nodeMeasuringDevice;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "MeasuringDeviceV2/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeMeasuringDevice = getNodeByTagName(this.XML, "MeasuringDeviceV2");
	if (nodeMeasuringDevice == undefined){this.isNull = true;return undefined;}

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
  
	this.Notes = ""; // Custom property
	
  // Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
  for (var len = nodeMeasuringDevice.children.length, n = 0; n < len; n++) {
    // Iterate through the main nodes first as there are more nodes than suffixes
    for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
      // Iterate through the possible suffixes to see if the current node matches
      if (nodeMeasuringDevice.children[n].tagName == "GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) {
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
	this.isNull = false;
	this.StorageId = "";
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerStorage(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeStorage;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy("GET", "Storage/" + id + "?LoadSubData=true", this.SetXML);
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeStorage = getNodeByTagName(this.XML, "Storage");
	if (nodeStorage == undefined){this.isNull = true;return undefined;}

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

function ZollerDocument(id){
	this.isNull = false;
	this.DocumentId = "";
	this.CreationTime = "";
	this.LastModified = "";
	this.Size = "";
	this.MimeType = "";
	this.Location = "";
	this.CustomProperties = {};
  if (id == undefined) {
    this.GetZollerData = function (id) {
      return new ZollerDocument(id);
    }
  }

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeDocument;
  if ((typeof id) == "object"){
		this.SetXML(id);
  } else {
    console.log("Invalid object type!");
  }
  nodeDocument = getNodeByTagName(this.XML, "Document");
	if (nodeDocument == undefined){this.isNull = true;return undefined;}

  this.DocumentId = getValue(nodeDocument, "Document.DocumentId");

	this.IsTrueZoller = true;
	
  this.CreationTime = getValue(nodeDocument, "Document.CreationTime");
  this.LastModified = getValue(nodeDocument, "Document.LastModified");
  this.DocumentSize = getValue(nodeDocument, "Document.Size");
  this.DocumentMimeType = getValue(nodeDocument, "Document.MimeType");
  this.DocumentLocation = getValue(nodeDocument, "Document.Location");
	
	// Allow code to dynamically add JavaScript to page
	if (this.DocumentMimeType == "application/javascript"){
		// First double check that the script hasn't already been added
		this.AddScript = function(){
			var ss = document.querySelectorAll("script[src='" + this.DocumentLocation + "']");
			var blnGood = true;
			if(ss.length > 0){
				blnGood = false;
			}
			if (blnGood){
				var s = document.createElement("script");
				s.src = this.DocumentLocation;
				s.type = this.DocumentMimeType;
				document.querySelector("head").appendChild(s);
				if (_Verbose){ console.log("Added new script!",this)}
			}else if(_Verbose){
				console.log("Script already exists!", this);
			}
		}
	}else if (this.DocumentMimeType == "text/xml"){
		this.ReferenceXML = ZollerGlobal.Request.FromProxy("GET", "Document/" + this.DocumentId, function(xml){this.ReferenceXML = xml});
		this.AddDataBlock = function(){
			var ss = document.querySelectorAll("script[data-documentid='" + this.DocumentId + "'][type='application/xml']");
			var blnGood = true;
			if(ss.length > 0){
				blnGood = false;
			}
			if (blnGood){
				var s = document.createElement("script");
				s.type = "application/xml";
				s.setAttribute("data-documentid",this.DocumentId);
				ZollerGlobal.Request.FromProxy("GET", "Document/" + this.DocumentId, function(xml){
					s.innerHTML = xml;
					if (_Verbose){ console.log("Added new script!",this)}
				});
				document.querySelector("head").appendChild(s);
			}else if(_Verbose){
				console.log("Script already exists!", this);
			}
		}
	}
}

function ZollerSubDocument(xml) {
  this.XML = xml;
  var nodeDocument = this.XML;

  this.URI = getValue(nodeDocument, "DocumentUri");
}
function ZollerSubFixture(){
	this.Position = -1;
	this.Quantity = 0;
	this.Fixture;
}
function ZollerSubMeasuringDeviceV2(){
	this.Position = -1;
	this.Quantity = 0;
	this.MeasuringDeviceV2;
}
function ZollerSubAccessory(){
	this.Position = -1;
	this.Quantity = 0;
	this.Accessory;
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
	this.Units = "mm";
	if (!isNaN(this.Value)){
		this.Convert = function(newUnits){
			if (newUnits == undefined){
				if (this.Units == "mm"){
					newUnits = "inches"
				}else if (this.Units == "inches"){
					newUnits = "mm";
				}
			}
			if (newUnits == "mm"){
				this.Value = Convert.InchesToMM(this.Value);
				this.Units = "mm";
			}else if(newUnits == "inches"){
				this.Value = Convert.MMToInches(this.Value);
				this.Units = "inches";
			}else{
				if (_Verbose){console.log("Indeterminable Units for ZollerCharacteristicItem",this)}
			}
			return this.Value;
		}
	}
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
  this.FileName = encodeURI(file);
  this.GraphicGroup = group;
  var img = new Image(ZollerGlobal.Graphics.PreviewSize.Medium.width, ZollerGlobal.Graphics.PreviewSize.Medium.height);
  if (this.FileName != undefined && this.GraphicGroup != undefined) {
    if (this.FileName.endsWith(".dxf") || this.FileName.endsWith(".stp")) {
      this.ImageURL = ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=800&h=600";
      img.src = ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + ZollerGlobal.Graphics.PreviewSize.Medium.width + "&h=" + ZollerGlobal.Graphics.PreviewSize.Medium.height;
    } else {
      this.ImageURL = ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName;
      img.src = this.ImageURL;
    }
  }
  img.setAttribute("class", "graphic");
  this.Image = img;
  this.GetCustomImageURL = function (width, height) {
    if (this.GraphicGroup != undefined && this.FileName != undefined && typeof this.GraphicGroup != "undefined" && typeof this.FileName != "undefined") {
      return ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + width + "&h=" + height;
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
function getAttribute(node, name){
	return node.attributes[name].value;
}
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
		if (xml.childNodes != undefined){
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
  if (xml != undefined) {
    if (xml.tagName == name) {
      return xml;
    }
  }else{
		return undefined
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

Convert = {
	RTFToPlainText: function(rtf){
		if (rtf != undefined) {
			rtf = rtf.replace(/\\par[d]?/g, "");
			return rtf.replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "").trim();
		} else {
			return "";
		}
	},
	PlainToRTF: function(plain){
		if (plain != undefined) {
			plain = plain.replace(/\n/g, "\\par\n");
			return "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang2057{\\fonttbl{\\f0\\fnil\\fcharset0 Microsoft Sans Serif;}}\n\\viewkind4\\uc1\\pard\\f0\\fs17 " + plain + "\\par\n}";
		} else {
			return "";
		}
	},
	MMToInches: function(input){
		if (!isNaN(input)){
			input = input / 25.4
		}
		return input
	},
	InchesToMM: function(input){
		if (!isNaN(input)){
			input = input * 25.4
		}
		return input
	}
}

Array.prototype.move = function(from, to){
	this.splice(to, 0, this.splice(from, 1)[0]);
};


var _ZollerACs = [];
// __tdm is a custom JSON object that represents a custom Article Characteristic Bar. The JSON helps define the appropriate labels for each identifier.
if (typeof __tdm !== "undefined") {
  _ZollerACs.push(new ZollerArticleCharacteristicBar(__tdm));
}

function ZollerServiceInstance(){
	this.isNull = false;

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeInstance;
	this.XML = ZollerGlobal.Request.FromProxy("GET", "service-instance/", this.SetXML);
  nodeInstance = getNodeByTagName(this.XML, "service-instance");
	if (nodeInstance == undefined){this.isNull = true;return undefined;}

	this.IsTrueZoller = true;
	
	this.WebServiceVersion = getAttribute(getNodeByTagName(this.XML, "service-instance"), "version");
	this.HostName = getAttribute(getNodeByTagName(this.XML, "service-instance"), "machine");
	this.Port = getAttribute(getNodeByTagName(this.XML, "service-instance"), "port");
	this.WebInterfaceVersion = getValue(getNodeByTagName(this.XML, "version"), "Interface");
	this.ZollerVersion = getValue(getNodeByTagName(this.XML, "version"), "System");
	this.DocumentsPath = getValue(getNodeByTagName(this.XML, "properties"), "DocumentRoot");
	this.GraphicsPath = getValue(getNodeByTagName(this.XML, "properties"), "GraphicRoot");
	this.AuthorizationType = getValue(getNodeByTagName(this.XML, "properties"), "AuthorizationType");
	this.AuthorizationRequired = (getValue(getNodeByTagName(this.XML, "properties"), "AuthorizationAllwaysRequired") == "true");
	this.DatabaseType = getValue(getNodeByTagName(this.XML, "database"), "DbSystem");
	this.DatabaseName = getValue(getNodeByTagName(this.XML, "database"), "Database");
	this.DatabaseVersion = getValue(getNodeByTagName(this.XML, "database"), "DbVersion");
	this.CharacteristicStructureNames = [];
	var cs = getNodes(getNodeByTagName(this.XML, "database"), "CharacteristicStructure");
	for (var len = cs.length, n = 0; n < len; n++){
		this.CharacteristicStructureNames.push({"Name":cs[n].innerHTML,"Type":getAttribute(cs[n],"type"),"Version":getAttribute(cs[n],"version"),"XML":cs[n]});
	}
}

function ZollerDocumentList(){
	this.isNull = false;

  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
  }

  var nodeDocumentList;
	this.XML = ZollerGlobal.Request.FromProxy("GET", "Document", this.SetXML);
  nodeDocumentList = getNodeByTagName(this.XML, "BrowseResult");
	if (nodeDocumentList == undefined){this.isNull = true;return undefined;}

	this.IsTrueZoller = true;
	
	this.Documents = [];
	
	var docs = getNodes(this.XML,"Document");
	if (docs != undefined){
		if (docs.length > 0){
			for (var len = docs.length, n = 0; n < len; n++){
				this.Documents.push(new ZollerDocument(docs[n]));
			}
		}
	}
}


// **************************************************************************
// ********************************UI Events********************************
//
// Notes:
//     These functions are handlers for various user interface functions 
//     such as drag and drop, adding/deleting, etc. 
//
// **************************************************************************

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


ZollerGlobal = {
	Graphics: {
		Suffixes: ["", "1", "2", "3", "4", "5", "6", "7", "8"],
		PreviewSize: {
			Large: {width: 150, height: 150},
			Medium: {width: 75, height: 75},
			Small: {width: 75, height: 75}
		},
		Sizes: ["sm", "md", "lg"],
		DefaultSize: "md",
		AllowEdit: false
	},
	XMLDeclaration: "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>",
	RequestBaseURL: "http://server:8086/UpdateSetupSheet.asmx/SetZoller",
	WebServiceBaseURL: "http://server:8084/ZollerDbService/",
	ServiceInstance: null,
	DocumentList: null,
	UserName: "zoller",
	UserPassword: "zoller",
	Request: {
		CreateAuthorization: function(method, query){
			var dat = (new Date()).getRFC2616();
			var auth = "ZWS ";
			var accId = btoa(ZollerGlobal.UserName);
			var req = query;
			if (req.indexOf("?") >= 0){req = req.substring(0, req.indexOf("?"))}
			if (req.lastIndexOf("/") == (req.length-1)){req = req.substring(0, req.lastIndexOf("/")-1)}
			var str2Sign = method + "\n" + dat + "\n" + req;
			var sign = b64_hmac_sha1(ZollerGlobal.UserPassword, str2Sign);
			auth += accId + ":" + sign;
			return {
					AccessId: accId,
					Signiture: {
						UserPassword: ZollerGlobal.UserPassword,
						String2Sign: {
							Method: method,
							DateTime: dat,
							Resource: req,
							ToString: function(){
								return str2Sign;
							}
						},
						ToString: function(){
							return sign;
						}
					},
					ToString: function(){
						return auth;
					}
			}
		},
		FromProxy: function(method, query, callback, data, async){
			var xhr = new XMLHttpRequest();
			if (async == undefined) { async = false; }
			xhr.open("POST", ZollerGlobal.RequestBaseURL, async);

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
							// New Code
							if (xhr.responseXML.firstChild != null && xhr.responseXML.firstChild.hasAttribute != null) {
								if (xhr.responseXML.firstChild.hasAttribute("result")) {
									if (xhr.responseXML.firstChild.getAttribute("result") == "fail") {
										console.log("Invalid response from TMS!");
										callback(undefined);
										return undefined;
									}
								}
							}
							callback(xhr.responseXML);
						}
					}
				}
			}
			if (data === null) {
				xhr.send("url=" + encodeURIComponent(ZollerGlobal.WebServiceBaseURL + query) + "&method=" + method + "&data=");
			} else {
				xhr.send("url=" + encodeURIComponent(ZollerGlobal.WebServiceBaseURL + query) + "&method=" + method + "&data=" + encodeURIComponent(data));
			}

			return xhr.responseXML;
		},
		FromService: function(method, query, callback, async){
			console.log("[ZollerGlobal.Request.FromService] This is an experimental function and requires that the TMS Web Service allows CORS!");
			var xhr = new XMLHttpRequest();
			if (async == undefined) { async = false; }
			xhr.open(method, ZollerGlobal.WebServiceBaseURL + query, async);

			xhr.setRequestHeader("Content-Type", "text/xml");
			var auth = ZollerGlobal.Request.CreateAuthorization(method,query);
			xhr.setRequestHeader("Authorization", auth.ToString());
			xhr.setRequestHeader("x-zws-date", auth.Signiture.String2Sign.DateTime);
			var loc = ZollerGlobal.WebServiceBaseURL;//window.location.toString();
			loc = loc.replace("http://","");
			loc = loc.substring(0, loc.indexOf("/"));
			xhr.setRequestHeader("Host", loc);
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
							// New Code
							if (xhr.responseXML.firstChild != null && xhr.responseXML.firstChild.hasAttribute != null) {
								if (xhr.responseXML.firstChild.hasAttribute("result")) {
									if (xhr.responseXML.firstChild.getAttribute("result") == "fail") {
										console.log("Invalid response from TMS!");
										callback(undefined);
										return undefined;
									}
								}
							}
							callback(xhr.responseXML);
						}
					}
				}
			}
			xhr.send();

			return xhr.responseXML;
		}
	},
	Set: {
		DragSourceElement: null,
		Handlers: function(){
			// Main Node click
			ZollerGlobal.Set.Handler(".assembly-name", "click", function (e) {
				var el = GetParentWithClass("assembly-name",e.target,3);
				if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("assembly-name") > -1) {
					ZollerGlobal.Raise.Tool.Selected(e.target.dataset.tool, el);
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".fixture-name", "click", function (e) {
				var el = GetParentWithClass("fixture-name",e.target,3);
				if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("fixture-name") > -1) {
					ZollerGlobal.Raise.Fixture.Selected(el.parentElement.dataset.fixture, el);
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});	ZollerGlobal.Set.Handler("li.fixture", "click", function (e) {
				var el = GetParentWithClass("fixture",e.target,3);
				if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("fixture") > -1) {
					ZollerGlobal.Raise.Fixture.Selected(el.dataset.fixture, el);
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".measure-name", "click", function (e) {
				var el = GetParentWithClass("measure-name",e.target,3);
				if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("measure-name") > -1) {
					ZollerGlobal.Raise.MeasuringDeviceV2.Selected(el.parentElement.dataset.measure, el);
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".accessory-name", "click", function (e) {
				var el = GetParentWithClass("accessory-name",e.target,3);
				if (el.getAttribute("class") === null || el.getAttribute("class").indexOf("accessory-name") > -1) {
					ZollerGlobal.Raise.Accessory.Selected(el.parentElement.dataset.accessory, el);
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".assembly-item", "click", function(e){
				// Double check that another function wasn't intended
				if (e.target.tagName == "A") { return false }
				var d = e.target;
				while (d.getAttribute("class") != "assembly-item") {
					d = d.parentElement;
				}
				ZollerGlobal.Raise.Component.Selected(d.dataset.component, d.dataset.tool, e.target)
			});
			
			// Drag events
			ZollerGlobal.Set.Handler(".assembly-item", "dragstart", function(e){
				this.style.opacity = "0.4";  // this / e.target is the source node.

				ZollerGlobal.Set.DragSourceElement = this;
				console.log("DragSource: ", ZollerGlobal.Set.DragSourceElement);

				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/html", this.outerHTML);
			});
			ZollerGlobal.Set.Handler(".assembly-item", "dragenter", function(e){
				// this / e.target is the current hover target.
				console.log("Drag Entered: ", this);
			});
			ZollerGlobal.Set.Handler(".assembly-item", "dragover", function(e){
				if (e.preventDefault) {
					e.preventDefault(); // Necessary. Allows us to drop.
				}
				if (ZollerGlobal.Set.DragSourceElement.dataset.tool == this.dataset.tool) {
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
			});
			ZollerGlobal.Set.Handler(".assembly-item", "dragleave", function(e){
				//this.classList.remove("over");  // this / e.target is previous target element.
			});
			ZollerGlobal.Set.Handler(".assembly-item", "drop", function(e){
				if (e.preventDefault) { e.preventDefault(); }
				if (e.stopPropagation) { e.stopPropagation(); }

				// Don't do anything if dropping the same column we're dragging.
				if (ZollerGlobal.Set.DragSourceElement != this) {
					// Set the source column's HTML to the HTML of the column we dropped on.
					console.log("Source: ", ZollerGlobal.Set.DragSourceElement);
					console.log("Target: ", this);
					ZollerGlobal.Set.DragSourceElement.outerHTML = this.outerHTML;
					this.outerHTML = e.dataTransfer.getData('text/html');
					ZollerGlobal.Set.Handlers();
				}

				return false;
			});
			ZollerGlobal.Set.Handler(".assembly-item", "dragend", function(e){
				// this/e.target is the source node.
				var cols = document.querySelectorAll('.assembly-item');
				[].forEach.call(cols, function (col) {
					col.classList.remove('over');
					col.style.opacity = "1";
				});
			});
			
			// Delete events
			ZollerGlobal.Set.Handler(".assembly-name > .delete", "click", function(e){
				ZollerGlobal.Raise.Tool.Delete(e.target.parentElement.dataset.tool, e.target);
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			ZollerGlobal.Set.Handler(".assembly-item > .delete", "click", function(e){
				ZollerGlobal.Raise.Component.Delete(e.target.parentElement.dataset.component, e.target.parentElement.dataset.tool, e.target);
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			ZollerGlobal.Set.Handler(".fixture-name > .delete", "click", function(e){
				ZollerGlobal.Raise.Fixture.Delete(e.target.parentElement.parentElement.dataset.fixture, e.target);
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			ZollerGlobal.Set.Handler("li.fixture > div > .delete", "click", function(e){
				ZollerGlobal.Raise.Fixture.Delete(e.target.parentElement.parentElement.dataset.fixture, e.target);
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			ZollerGlobal.Set.Handler(".measure-name > .delete", "click", function(e){
				ZollerGlobal.Raise.MeasuringDeviceV2.Delete(e.target.parentElement.parentElement.dataset.measure, e.target);
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			ZollerGlobal.Set.Handler(".accessory-name > .delete", "click", function(e){
				ZollerGlobal.Raise.Accessory.Delete(e.target.parentElement.parentElement.dataset.accessory, e.target);
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			
			// Add component
			ZollerGlobal.Set.Handler(".add-component","click",function (e) {
				ZollerGlobal.Raise.Component.AddToTool(e.target.parentElement.dataset.tool, e.target)
				e.stopImmediatePropagation();
				e.preventDefault();
			});
			
			// Flip button events
			ZollerGlobal.Set.Handler(".assembly-name > .accessorycount > .flip-item", "click", function (e) {
				var blnGood = false;
				if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
					blnGood = true;
				}
				if (blnGood){
					var parAss = e.target.parentElement.parentElement.parentElement; // Get Fixture container
					var subAccDiv = parAss.querySelector(".accessory-sub"); // Get Accessory-Sub container
					if (_Verbose){
						console.log("Assembly Height: ",parAss.clientHeight);
						console.log("\tAccessory Height: ",subAccDiv.clientHeight);
					}
					var closing = subAccDiv.classList.contains("show"); // Check sub-container visibility
					subAccDiv.classList.toggle("show"); // Show/Hide the Accessory-Sub container
					if (_Verbose){console.log("\t\tAccessory Height: ",subAccDiv.clientHeight)}
					var count = subAccDiv.querySelectorAll(".accessory").length; // Number of accessory items in the sub-container
					if ((subAccDiv.clientHeight) == 0 && parAss.querySelector(".show") == null) {
						parAss.style.removeProperty("height");
					} else {
						parAss.style.height = "calc(var(--sizeHeight) + " + (subAccDiv.clientHeight) + "px)";
					}
					e.target.classList.toggle("flipped");
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".fixture-name > .childcount > .flip-item", "click", function (e) {
				var blnGood = false;
				if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
					blnGood = true;
				}
				if (blnGood){
					var parFixt = e.target.parentElement.parentElement.parentElement;
					var subAccDiv = parFixt.querySelector(".accessory-sub");
					var subFixtDiv = parFixt.querySelector(".fixture-sub");
					if (_Verbose){
						console.log("Fixture Height: ",parFixt.clientHeight);
						console.log("\tSub-Fixture Height: ",subFixtDiv.clientHeight);
						console.log("\tAccessory Height: ",subAccDiv.clientHeight);
					}
					var closing = subFixtDiv.classList.contains("show");
					subFixtDiv.classList.toggle("show");
					if (_Verbose){console.log("\t\tSub-Fixture Height: ",subFixtDiv.clientHeight);}
					var count = subFixtDiv.querySelectorAll(".fixture").length;
					var totHeight = 0;
					if (subAccDiv != undefined){
						totHeight = subFixtDiv.clientHeight + subAccDiv.clientHeight;
					}else{
						totHeight = subFixtDiv.clientHeight;
					}
					if (totHeight == 0 && parFixt.querySelector(".show") == null) {
						parFixt.style.removeProperty("height");
					} else {
						parFixt.style.height = "calc(var(--sizeHeight) + " + totHeight + "px)";
					}
					e.target.classList.toggle("flipped");
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".fixture-name > .accessorycount > .flip-item", "click", function (e) {
				var blnGood = false;
				if (e.target.getAttribute("class") === null || e.target.getAttribute("class").indexOf("flip-item") > -1){
					blnGood = true;
				}
				if (blnGood){
					var parFixt = e.target.parentElement.parentElement.parentElement; // Get Fixture container
					var subAccDiv = parFixt.querySelector(".accessory-sub"); // Get Accessory-Sub container
					var subFixtDiv = parFixt.querySelector(".fixture-sub"); // Get Fixture-Sub container
					if (_Verbose){
						console.log("Fixture Height: ",parFixt.clientHeight);
						console.log("\tSub-Fixture Height: ",subFixtDiv.clientHeight);
						console.log("\tAccessory Height: ",subAccDiv.clientHeight);
					}
					var closing = subAccDiv.classList.contains("show"); // Check sub-container visibility
					subAccDiv.classList.toggle("show"); // Show/Hide the Accessory-Sub container
					if (_Verbose){console.log("\t\tAccessory Height: ",subAccDiv.clientHeight)}
					var count = subAccDiv.querySelectorAll(".accessory").length; // Number of accessory items in the sub-container
					var totHeight = 0;
					if (subFixtDiv != undefined){
						totHeight = subFixtDiv.clientHeight + subAccDiv.clientHeight;
					}else{
						totHeight = subAccDiv.clientHeight;
					}
					if (totHeight == 0 && parFixt.querySelector(".show") == null) {
						parFixt.style.removeProperty("height");
					} else {
						parFixt.style.height = "calc(var(--sizeHeight) + " + totHeight + "px)";
					}
					e.target.classList.toggle("flipped");
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			});
			ZollerGlobal.Set.Handler(".measure-name > .accessorycount > .flip-item", "click", function (e) {
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
		},
		Handler: function(query, onevent, callback){
			var cols = document.querySelectorAll(query);
			for (var len = cols.length, n = 0; n < len; n++){
				cols[n].addEventListener(onevent, callback, false);
			}
		},
		EditState: function(state){
			var els = document.querySelectorAll(".delete");
			[].forEach.call(els, function (el) {
				el.classList.toggle("noEdit", !state);
			});
			els = document.querySelectorAll(".add-component");
			[].forEach.call(els, function (el) {
				el.classList.toggle("noEdit", !state);
			});
		}
	},
	Raise: {
		Accessory: {
			Delete: function(Accessory, el){
				var evt = document.createEvent("Events");
				evt.initEvent("accessorydelete", true, true);
				evt.AccessoryId = Accessory;
				el.dispatchEvent(evt);
			},
			Selected: function(Accessory, el){
				var evt = document.createEvent("Events");
				evt.initEvent("accessoryselected", true, true);
				evt.AccessoryId = Accessory;
				el.dispatchEvent(evt);
			}
		},
		MeasuringDeviceV2: {
			Delete: function(Measuring, el){
				var evt = document.createEvent("Events");
				evt.initEvent("measuredelete", true, true);
				evt.MeasuringDeviceId = Measuring;
				el.dispatchEvent(evt);
			},
			Selected: function(Measuring, el){
				var evt = document.createEvent("Events");
				evt.initEvent("measureselected", true, true);
				evt.MeasuringDeviceId = Measuring;
				el.dispatchEvent(evt);
			}
		},
		Fixture: {
			Delete: function(Fixture, el){
				var evt = document.createEvent("Events");
				evt.initEvent("fixturedelete", true, true);
				evt.FixtureId = Fixture;
				el.dispatchEvent(evt);
			},
			Selected: function(Fixture, el){
				var evt = document.createEvent("Events");
				evt.initEvent("fixtureselected", true, true);
				evt.FixtureId = Fixture;
				el.dispatchEvent(evt);
			}
		},
		Tool: {
			Delete: function(Tool, el){
				var evt = document.createEvent("Events");
				evt.initEvent("tooldelete", true, true);
				evt.ToolId = Tool;
				el.dispatchEvent(evt);
			},
			Edit: function(Tool, el){
				var evt = document.createEvent("Events");
				evt.initEvent("tooledit", true, true);
				evt.ToolId = Tool;
				el.dispatchEvent(evt);
			},
			Selected: function(Tool, el){
				var evt = document.createEvent("Events");
				evt.initEvent("toolselected", true, true);
				evt.ToolId = Tool;
				el.dispatchEvent(evt);
			}
		},
		Component: {
			Delete: function(Component, Tool, el){
				var evt = document.createEvent("Events");
				evt.initEvent("componentdelete", true, true);
				evt.ComponentId = Component;
				evt.ToolId = Tool;
				el.dispatchEvent(evt);
			},
			AddToTool: function(Tool, el){
				var evt = document.createEvent("Events");
				evt.initEvent("componentadd", true, true);
				evt.ToolId = Tool;
				el.dispatchEvent(evt);
			},
			Selected: function(Component, Tool, el){
				var evt = document.createEvent("Events");
				evt.initEvent("componentselected", true, true);
				evt.ToolId = Tool;
				evt.ComponentId = Component;
				el.dispatchEvent(evt);
			}
		}
	}
}
ZollerGlobal.ServiceInstance = new ZollerServiceInstance();
ZollerGlobal.DocumentList = new ZollerDocumentList();

// Prototype addition to Date to get RFC 2616
Date.prototype.getRFC2616 = function(){
	var daysOfWeek = ["Sun","Mon","Tues","Wed","Thurs","Fri","Sat"];
	var monthsOfYear = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
	
	var d = new Date();
	var strD = daysOfWeek[d.getDay()] + ", " + d.getDate() + " " + monthsOfYear[d.getMonth()] + " " + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + " GMT";
	return strD
}

// **************************************************************************
// *********Hash Coding from https://gist.github.com/macton/1743087*********
// **************************************************************************
function hex_sha1(a){return rstr2hex(rstr_sha1(str2rstr_utf8(a)))}function b64_sha1(a){return rstr2b64(rstr_sha1(str2rstr_utf8(a)))}function any_sha1(a,b){return rstr2any(rstr_sha1(str2rstr_utf8(a)),b)}function hex_hmac_sha1(a,b){return rstr2hex(rstr_hmac_sha1(str2rstr_utf8(a),str2rstr_utf8(b)))}function b64_hmac_sha1(a,b){return rstr2b64(rstr_hmac_sha1(str2rstr_utf8(a),str2rstr_utf8(b)))}function any_hmac_sha1(a,b,c){return rstr2any(rstr_hmac_sha1(str2rstr_utf8(a),str2rstr_utf8(b)),c)}function sha1_vm_test(){return"a9993e364706816aba3e25717850c26c9cd0d89d"==hex_sha1("abc")}function rstr_sha1(a){return binb2rstr(binb_sha1(rstr2binb(a),8*a.length))}function rstr_hmac_sha1(a,b){var c=rstr2binb(a);c.length>16&&(c=binb_sha1(c,8*a.length));for(var d=Array(16),e=Array(16),f=0;f<16;f++)d[f]=909522486^c[f],e[f]=1549556828^c[f];var g=binb_sha1(d.concat(rstr2binb(b)),512+8*b.length);return binb2rstr(binb_sha1(e.concat(g),672))}function rstr2hex(a){for(var d,b=hexcase?"0123456789ABCDEF":"0123456789abcdef",c="",e=0;e<a.length;e++)d=a.charCodeAt(e),c+=b.charAt(d>>>4&15)+b.charAt(15&d);return c}function rstr2b64(a){for(var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",c="",d=a.length,e=0;e<d;e+=3)for(var f=a.charCodeAt(e)<<16|(e+1<d?a.charCodeAt(e+1)<<8:0)|(e+2<d?a.charCodeAt(e+2):0),g=0;g<4;g++)c+=8*e+6*g>8*a.length?b64pad:b.charAt(f>>>6*(3-g)&63);return c}function rstr2any(a,b){var e,f,g,h,c=b.length,d=Array(),i=Array(Math.ceil(a.length/2));for(e=0;e<i.length;e++)i[e]=a.charCodeAt(2*e)<<8|a.charCodeAt(2*e+1);for(;i.length>0;){for(h=Array(),g=0,e=0;e<i.length;e++)g=(g<<16)+i[e],f=Math.floor(g/c),g-=f*c,(h.length>0||f>0)&&(h[h.length]=f);d[d.length]=g,i=h}var j="";for(e=d.length-1;e>=0;e--)j+=b.charAt(d[e]);var k=Math.ceil(8*a.length/(Math.log(b.length)/Math.log(2)));for(e=j.length;e<k;e++)j=b[0]+j;return j}function str2rstr_utf8(a){for(var d,e,b="",c=-1;++c<a.length;)d=a.charCodeAt(c),e=c+1<a.length?a.charCodeAt(c+1):0,55296<=d&&d<=56319&&56320<=e&&e<=57343&&(d=65536+((1023&d)<<10)+(1023&e),c++),d<=127?b+=String.fromCharCode(d):d<=2047?b+=String.fromCharCode(192|d>>>6&31,128|63&d):d<=65535?b+=String.fromCharCode(224|d>>>12&15,128|d>>>6&63,128|63&d):d<=2097151&&(b+=String.fromCharCode(240|d>>>18&7,128|d>>>12&63,128|d>>>6&63,128|63&d));return b}function str2rstr_utf16le(a){for(var b="",c=0;c<a.length;c++)b+=String.fromCharCode(255&a.charCodeAt(c),a.charCodeAt(c)>>>8&255);return b}function str2rstr_utf16be(a){for(var b="",c=0;c<a.length;c++)b+=String.fromCharCode(a.charCodeAt(c)>>>8&255,255&a.charCodeAt(c));return b}function rstr2binb(a){for(var b=Array(a.length>>2),c=0;c<b.length;c++)b[c]=0;for(var c=0;c<8*a.length;c+=8)b[c>>5]|=(255&a.charCodeAt(c/8))<<24-c%32;return b}function binb2rstr(a){for(var b="",c=0;c<32*a.length;c+=8)b+=String.fromCharCode(a[c>>5]>>>24-c%32&255);return b}function binb_sha1(a,b){a[b>>5]|=128<<24-b%32,a[(b+64>>9<<4)+15]=b;for(var c=Array(80),d=1732584193,e=-271733879,f=-1732584194,g=271733878,h=-1009589776,i=0;i<a.length;i+=16){for(var j=d,k=e,l=f,m=g,n=h,o=0;o<80;o++){o<16?c[o]=a[i+o]:c[o]=bit_rol(c[o-3]^c[o-8]^c[o-14]^c[o-16],1);var p=safe_add(safe_add(bit_rol(d,5),sha1_ft(o,e,f,g)),safe_add(safe_add(h,c[o]),sha1_kt(o)));h=g,g=f,f=bit_rol(e,30),e=d,d=p}d=safe_add(d,j),e=safe_add(e,k),f=safe_add(f,l),g=safe_add(g,m),h=safe_add(h,n)}return Array(d,e,f,g,h)}function sha1_ft(a,b,c,d){return a<20?b&c|~b&d:a<40?b^c^d:a<60?b&c|b&d|c&d:b^c^d}function sha1_kt(a){return a<20?1518500249:a<40?1859775393:a<60?-1894007588:-899497514}function safe_add(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c}function bit_rol(a,b){return a<<b|a>>>32-b}var hexcase=0,b64pad="=";