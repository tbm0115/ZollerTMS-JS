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
var _Verbose = false;

function ZollerObject(type, id, global){
	if ((typeof ZollerType[type]) !== "undefined"){
		this.Type = ZollerType[type];
	}else{
		if (_Verbose){console.log("[ZollerObject.ctor] Couldn't define Object type from:", type);}
	}
	// Object Properties
	this.isNull = true;
	this.ZollerProperties = {};
	this.CustomProperties = {};
	this.AdditionalData = {};
	this.Images = [];

	// Setup ZollerProperties regardless of validity in Zoller to ensure properties are available
	if ((typeof this.Type) !== "undefined"){
		for(var len=this.Type.Properties.length,n=0;n<len;n++){
			this.ZollerProperties[this.Type.Properties[n].Name] = null;
		}
		this.GlobalReference = this.Type.Name;
	}
	if ((typeof global) !== "undefined" && global !== null){
		this.GlobalReference = global;
	}
	
	this.Initialize = (function(){
		if ((typeof this.Type) === "undefined"){return this;}
		if (_Verbose){console.log("[ZollerObject.Initialize] Initializing " + this.Type.Name + ": ", this)}
		
		if ((typeof this.XML) !== "undefined"){
			var node = getNodeByTagName(this.XML, this.Type.Name, this.Type.Name + ".");
			if ((typeof node) !== "undefined" && node.childNodes.length > 0){
				// Iterate through all nodes, so you can capture AdditionalData fields
				var tmpNewObject;
				for (var len=node.childNodes.length,n=0;n<len;n++){
					if (node.childNodes[n].nodeName != "#text"){
						if (node.childNodes[n].nodeName.indexOf("GraphicFile") >= 0){
							this.Images.push(new ZollerGraphicImage(node.childNodes[n].textContent, getValue(node, node.childNodes[n].nodeName.replace("File", "Group"))));
						}else if(node.childNodes[n].nodeName.indexOf("GraphicGroup") >= 0){
							// Skip Graphic Group as it's handled in previous logic
						}else if (ContainsProperty(this.Type, node.childNodes[n].nodeName)){
							this.ZollerProperties[node.childNodes[n].nodeName] = node.childNodes[n].textContent;
						}else if(this.Type.SubTypes.indexOf(node.childNodes[n].nodeName) >= 0){
							tmpNewObject = new ZollerObject(node.childNodes[n].nodeName, node.childNodes[n],this.GlobalReference + "['" + node.childNodes[n].nodeName + "']");//this[node.childNodes[n].nodeName].Type.Name + "']");
							if (!tmpNewObject.isNull){
								this[node.childNodes[n].nodeName] = tmpNewObject;
							}else if(_Verbose){
								console.log("\t[ZollerObject.Initialize] Not adding SubType '" + node.childNodes[n].nodeName + "' because it initialized as null.");
							}
							//this[node.childNodes[n].nodeName]["GlobalReference"] = this.GlobalReference + "['" + this[node.childNodes[n].nodeName].Type.Name + "']";
						}else if(ContainsEnum(this.Type, node.childNodes[n].nodeName)){
							var enm = GetEnum(this.Type, node.childNodes[n].nodeName);
							var enmn = getNodes(node.childNodes[n], ZollerType[enm.Name].Name + "InList"); // Get all object nodes
							if (enmn.length > 0){
								this[enm.Name + "List"] = new Array();
								for (var enlen = enmn.length, en = 0; en < enlen; en++){
									// Iterate through Node Object references
									var nwEnumObj = new ZollerObject(enm.Name, enmn[en], this.GlobalReference + "['" + enm.Name + "List'][" + en + "]");
									//nwEnumObj["GlobalReference"] = this.GlobalReference + "['" + nwEnumObj.Type.Name + "List'][" + en + "]";
									for (var enplen = enm.Properties.length, enp = 0; enp < enplen; enp++){
										nwEnumObj.ZollerProperties[enm.Properties[enp].Name] = getValue(enmn[en], enm.Properties[enp].Name);
									}
									if (!nwEnumObj.isNull){
										this[enm.Name + "List"].push(nwEnumObj);
									}else if (_Verbose){
										console.log("\t[ZollerObject.Initialize] Not adding Enumerable '" + enm.Name + "' because it initialized as null.");
									}
								}
							}
						}else{ // Assumed AdditionalData
							if (node.childNodes[n].childNodes == undefined || node.childNodes[n].childNodes.length <= 1){
								this.AdditionalData[node.childNodes[n].nodeName] = node.childNodes[n].textContent;
							}
						}
					}
				}
				this.isNull = false;
			}else{
				this.isNull = true;
			}
		}else{
			this.isNull = true;
		}
		for(var len=this.Type.SubTypes.length,n=0;n<len;n++){
			if ((typeof this[this.Type.SubTypes[n]]) === "undefined"){
				//this[this.Type.SubTypes[n]] = new ZollerObject(this.Type.SubTypes[n], ""); // Create empty reference
			}
		}
		for(var len=this.Type.EnumerableTypes.length,n=0;n<len;n++){
			if((typeof this[this.Type.EnumerableTypes[n].Name + "List"]) === "undefined"){
				this[this.Type.EnumerableTypes[n].Name + "List"] = new Array();
			}
		}
		return this;
	}).bind(this);
	
	this.Update = (function(){
		if (this.Type == undefined || this.ZollerProperties[this.Type.Name + "Id"] == undefined){return this}
		if (_Verbose){console.log("Initializing " + this.Type.Name + ": ", this)}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, this.Type.Name, this.Type.Name + ".");
		if (node == undefined){this.isNull = true;return undefined;}
		
		// Populate Zoller Properties
		var prps = Object.getOwnPropertyNames(this.ZollerProperties);
		for (var len = prps.length, n = 0; n < len; n++){
			if (this.ZollerProperties[prps[n]] != undefined && this.ZollerProperties[prps[n]] != "" && this.ZollerProperties[prps[n]] != null){
				var nds = getNodesByXPath(this.XML, "//" + this.Type.Name + "/" + prps[n] + "/text()/..");
				if (nds != undefined && nds.length > 0){
					// We're doing to first node regardless, because the "ZollerProperty" should be higher in the structure than some similar Enumerable or Sub Type nodes
					nds[0].textContent = this.ZollerProperties[prps[n]];
					console.log("Changed '" + prps[n] + "' value to '" + this.ZollerProperties[prps[n]] + "': ", nds[0]);
				}else{
					var xdoc = this.XML.ownerDocument;
					if (xdoc == null){xdoc = this.XML}
					var nwProp = xdoc.createElement(this.Type.Properties[n].Name);
					nwProp.textContent = this.ZollerProperties[this.Type.Properties[n].Name];
					node.appendChild(nwProp);
					console.log("Had to add a property to the XML");
				}
			}
		}
		
		// Remove sub types from XML
		for (var len = this.Type.SubTypes.length, n = 0; n < len; n++){
			var nds = getNodesByXPath(this.XML, "//" + this.Type.Name + "/" + this.Type.SubTypes[n]);
			for (var ndlen = nds.length, nd = 0; nd < ndlen; nd++){
				nds[nd].parentNode.removeChild(nds[nd]);
			}
		}
		
		
		// Remove empty nodes
		var emptyNodes = getNodesByXPath(this.XML, "//*[(not(text()) or text() = '') and not(./*)]");
		if (emptyNodes != undefined && emptyNodes.length > 0){
			for (var len = emptyNodes.length, n = 0; n < len; n++){
				emptyNodes[n].parentNode.removeChild(emptyNodes[n]);
			}
		}
		
		// Submit request to update
		ZollerGlobal.Request.FromProxy("PUT", this.Type.Name + "/" + this.ZollerProperties[this.Type.Name + "Id"], function(xml){
				if (xml != undefined){
					console.log("Response XML was fine", xml);
				}else{
					console.log("Response XML was undefined for update using: ", node);
				}
			}, "<Data>" + node.outerHTML.replace(/\>\s+\</g,'><') + "</Data>");
		return {Method: "PUT", Query: this.Type.Name + "/" + this.ZollerProperties[this.Type.Name + "Id"], Data: "<Data>" + node.outerHTML.replace(/\>\s+\</g,'><') + "</Data>"}
	}).bind(this);
	this.Create = (function(){
		var xmlStr = "<Data><" + this.Type.Name + ">";
		var props = Object.getOwnPropertyNames(this.ZollerProperties);
		if (props != undefined && props.length > 0){
			for (var len = props.length, n = 0; n < len; n++){
				if (this.ZollerProperties[props[n]] != null && this.ZollerProperties[props[n]] != "" && this.ZollerProperties[props[n]] != undefined){
					xmlStr += "<" + props[n] + ">" + this.ZollerProperties[props[n]] + "</" + props[n] + ">";
				}
			}
		}
		xmlStr += "</" + this.Type.Name + "></Data>";
		
		// Submit request to create
		ZollerGlobal.Request.FromProxy("POST", this.Type.Name, function(xml){
				if (xml != undefined){
					console.log("Response XML was fine", xml);
				}else{
					console.log("Response XML was undefined for create using: ", node);
				}
			}, xmlStr);
		return {Method: "POST", Query: this.Type.Name}
	}).bind(this);
	this.RemoveChild = (function(obj){
		if (obj != undefined && obj.Type != undefined){
			var lstRef;
			var xmlDoc = this.XML.ownerDocument;
			if (xmlDoc == undefined){xmlDoc = this.XML}
			var props = Object.getOwnPropertyNames(this);
			if (props != undefined && props.length > 0){
				// Try to find the list type by the sent object type
				for (var len = props.length, n = 0; n < len; n++){
					if (props[n].indexOf(obj.Type.Name + "List") >= 0){
						lstRef = this[props[n]];
						break;
					}
				}
				if (lstRef != undefined){
					// Try to find the object in the list by the sent objects Id
					for (var len = lstRef.length, n = 0; n < len; n++){
						if (lstRef[n].ZollerProperties[lstRef[n].Type.Name + "Id"] == obj.ZollerProperties[obj.Type.Name + "Id"] && lstRef[n].Type.Name == obj.Type.Name){
							lstRef.splice(n,1);
						}
					}
				}
			}
			var nds = getNodesByXPath(this.XML, "//" + this.Type.Name + "/*/*/" + obj.Type.Name + "/" + obj.Type.Name + "Id[text() = \"" + obj.ZollerProperties[obj.Type.Name + "Id"] + "\"]/../..");
			if (nds != undefined){
				for (var len = nds.length, n = 0; n < len; n++){
					nds[n].parentNode.removeChild(nds[n]);
				}
				return true;
			}else{
				console.log("[ZollerObject.RemoveChild] No nodes returned");
			}
		}
		return false;
	}).bind(this);
	this.AddChild = (function(obj){
		if ((typeof obj) !== "undefined" && (typeof obj.Type) !== "undefined"){
			var lstRef;
			var xmlDoc = this.XML.ownerDocument;
			if ((typeof xmlDoc) === "undefined"){xmlDoc = this.XML}
			var props = Object.getOwnPropertyNames(this);
			if ((typeof props) !== "undefined" && props.length > 0){
				for (var len = props.length, n = 0; n < len; n++){
					if (props[n].indexOf(obj.Type.Name + "List") >= 0){
						lstRef = this[props[n]];
						break;
					}
				}
			}
			var lstNod;
			var rootNod = getNodeByTagName(this.XML, this.Type.Name, this.Type.Name + ".");
			// Get/Create list node
			if ((typeof lstRef) === "undefined"){
				this[obj.Type.Name + "List"] = new Array();
			}
			this[obj.Type.Name + "List"].push(obj);
			lstNod = getNodeByTagName(rootNod, obj.Type.Name + "List", this.Type.Name + ".");
			if (lstNod == undefined){
				lstNod = xmlDoc.createElement(obj.Type.Name + "List");
				rootNod.appendChild(lstNod);
			}
			var inlstNod = xmlDoc.createElement(obj.Type.Name + "InList");
			// Add Enumerable Properties (ex Position, Quantity, etc.)
			var enm = GetEnum(this.Type, obj.Type.Name + "List");
			if (enm != undefined){
				var nProps = new Array();
				for (var len = enm.Properties.length, n = 0; n < len; n++){
					var propName = enm.Properties[n].Name;
					console.log("[ZollerObject.AddChild] Trying to add Enumerable Property[" + propName + "]: ", enm.Properties[n]);
					nProps.push(xmlDoc.createElement(propName));
					if (obj.ZollerProperties[propName] != undefined && obj.ZollerProperties[propName] != null && obj.ZollerProperties[propName] != ""){
						//var prpNod = xmlDoc.createElement(propName);
						//var txtNod = xmlDoc.createTextNode(obj.ZollerProperties[propName]);
						nProps[n].textContent = obj.ZollerProperties[propName];//.appendChild(txtNod);
						inlstNod.appendChild(nProps[n]);
						console.log("\tProperty is not empty or null![" + obj.ZollerProperties[propName] + "] ", nProps[n]);
					}else{
						console.log("\tProperty was empty or null...", obj.ZollerProperties[propName]);
					}
				}
				console.log("[ZollerObject.AddChild] Enumerable Property Nodes: ", nProps);
				// Add new object's XML structure
				var objNod = getNodeByTagName(obj.XML, obj.Type.Name);
				inlstNod.appendChild(objNod);
				lstNod.appendChild(inlstNod);
				return lstNod;
			}else{
				console.log("[ZollerObject.AddChild] Could not find EnumerableType for '" + obj.Type.Name + "' in: ", this.Type);
			}
		}else{
			console.log("[ZollerObject.AddChild] Object is either undefined or it's type is undefined");
		}
		return undefined;
	}).bind(this);
	
  this.XML = undefined;
  this.SetXML = (function (xml) {
		if (_Verbose){console.log("[ZollerObject.SetXML] Setting XML: ",this)}
		this.XML = xml;
		return this.Initialize();
  }).bind(this);

  if ((typeof id) === "string" && (typeof this.Type) !== "undefined") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", this.Type.Name + "/" + id + "?LoadSubData=true&ExportEmptyFields=true", this.SetXML); // Must specify context for Initialization to work after SetXML
  } else if ((typeof id) == "object") {
    return this.SetXML(id);
  } else {
    console.log("[ZollerObject.SetXML] Invalid object type!");
		this.isNull = true;
  }
		
	this.Initialize();
	return this;
}
ZollerType = {
	Adapter: {
		Name: "Adapter",
		Properties: [
			new ZollerProperty("AdapterId", "ID", true),
			new ZollerProperty("Name", "Name", true),
			new ZollerProperty("AdapterType", "Type", true),
			new ZollerProperty("AdpXMax"),
			new ZollerProperty("AdpZMax"),
			new ZollerProperty("Comment"),
			new ZollerProperty("DrmYOffset"),
			new ZollerProperty("EdmXOffset"),
			new ZollerProperty("MasterAdapter"),
			new ZollerProperty("StorageLocation")
		],
		SubTypes: [
			"AdapterPresetter"
		],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	AdapterPresetter: {
		Name: "AdapterPresetter",
		Properties: [
			new ZollerProperty("CES"),
			new ZollerProperty("Focus"),
			new ZollerProperty("MsrRangeWidth"),
			new ZollerProperty("IsTurnable"),
			new ZollerProperty("IsDriven"),
			new ZollerProperty("IsHSKAdapter"),
			new ZollerProperty("TIReindexSpindle"),
			new ZollerProperty("CheckToolClamp"),
			new ZollerProperty("ZRefMode"),
			new ZollerProperty("ZDiaMode"),
			new ZollerProperty("XRefMode"),
			new ZollerProperty("UseMode"),
			new ZollerProperty("RunOutDoCorrection"),
			new ZollerProperty("AxialRadialRunOutDoCorrection"),
			new ZollerProperty("DetectAdapterCenter"),
			new ZollerProperty("BarcodeDoRotation"),
			new ZollerProperty("BarcodeManualIllumination"),
			new ZollerProperty("MsrRangeHeight"),
			new ZollerProperty("CalibrationDate"),
			new ZollerProperty("TIPositionC"),
			new ZollerProperty("TIPositionW"),
			new ZollerProperty("TIHomePositionW"),
			new ZollerProperty("TIPosition2C"),
			new ZollerProperty("TIPosition2W"),
			new ZollerProperty("TIHomePosition2W"),
			new ZollerProperty("XDiaMode"),
			new ZollerProperty("RunOutValue"),
			new ZollerProperty("RunOutDiameter"),
			new ZollerProperty("RunOutAngle"),
			new ZollerProperty("AxialRunOut0"),
			new ZollerProperty("RadialRunOut0"),
			new ZollerProperty("AxialRunOut90"),
			new ZollerProperty("RadialRunOut90"),
			new ZollerProperty("AxialRunOut180"),
			new ZollerProperty("RadialRunOut180"),
			new ZollerProperty("AxialRunOut270"),
			new ZollerProperty("RadialRunOut270"),
			new ZollerProperty("AxialRunOutValues"),
			new ZollerProperty("CncAxisX"),
			new ZollerProperty("BarcodeSymbolType"),
			new ZollerProperty("BarcodeResizeRatio"),
			new ZollerProperty("BarcodeRadius"),
			new ZollerProperty("BarcodeColumnsCount"),
			new ZollerProperty("CorrectionZ")
		],
		SubTypes: [],
		EnumerableTypes: []
	},
	Machine: {
		Name: "Machine",
		Properties: [
			new ZollerProperty("MachineId"),
			new ZollerProperty("Name"),
			new ZollerProperty("Description"),
			new ZollerProperty("MagazineCapacity"),
			new ZollerProperty("NCToDirectory"),
			new ZollerProperty("NCFromDirectory"),
			new ZollerProperty("Type"),
			new ZollerProperty("Manufacturer"),
			new ZollerProperty("FactoryNo"),
			new ZollerProperty("InventoryNo"),
			new ZollerProperty("MachineGroupField"),
			new ZollerProperty("YearOfConstruction"),
			new ZollerProperty("CommissioningDate"),
			new ZollerProperty("Label"),
			new ZollerProperty("DeliveryDate"),
			new ZollerProperty("MachineLocation"),
			new ZollerProperty("PlaceNo"),
			new ZollerProperty("Dimension"),
			new ZollerProperty("Weight"),
			new ZollerProperty("AreaRequirement"),
			new ZollerProperty("FundamentNo"),
			new ZollerProperty("ElectricStreamplanNo"),
			new ZollerProperty("TotalConnectionValue"),
			new ZollerProperty("TotalPower"),
			new ZollerProperty("Voltage"),
			new ZollerProperty("Frequency"),
			new ZollerProperty("HourlyRate"),
			new ZollerProperty("NoOfMagazinPositions"),
			new ZollerProperty("NcProgrammTransferPath"),
			new ZollerProperty("NcProgrammDeleteBeforeTransfer"),
			new ZollerProperty("NcProgrammDeleteAfterTransfer"),
			new ZollerProperty("NcProgrammTransferBackPath"),
			new ZollerProperty("NcProgrammEndTag"),
			new ZollerProperty("NcProgrammTransferEndTag"),
			new ZollerProperty("NcProgrammTransferEndIdleTime"),
			new ZollerProperty("NcProgrammSplit"),
			new ZollerProperty("UseTurningAdvisor"),
			new ZollerProperty("LongComment"),
			new ZollerProperty("CostCenter"),
			new ZollerProperty("PostProcessorId"),
			new ZollerProperty("DeliveryDay"),
			new ZollerProperty("CommunicationDevice"),
			new ZollerProperty("TIStringId"),
			new ZollerProperty("MagazinePositionInfoId"),
			new ZollerProperty("TargetResolverId"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("TurningAdvisorDataRef"),
			new ZollerProperty("FMV")
		],
		SubTypes: [],
		EnumerableTypes: [
			new ZollerEnumType("MachineToolList", "Tool"),
			new ZollerEnumType("SettingSheetList", "SettingSheet"),
			new ZollerEnumType("MachineAccessoryList", "Accessory"),
			new ZollerEnumType("MachineAdapterList", "Adapter"),
			new ZollerEnumType("ExternalDocument", "ExternalDocument",[new ZollerProperty("Position")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			ExportObjectsWithGroup: false,
			LoadMachineAccessoryList: false,
			LoadMachineAdapterList: false,
			LoadMachinePlacesLis: false,
			LoadMachineSettingSheetList: false,
			LoadMachineToolList: false,
			LoadStorageBookingData: false
		}
	},
	SettingSheet: {
		Name: "SettingSheet",
		Properties: [
			new ZollerProperty("SettingSheetId"),
			new ZollerProperty("Name"),
			new ZollerProperty("WorkStep"),
			new ZollerProperty("ArticleNo"),
			new ZollerProperty("CostCenter"),
			new ZollerProperty("DrawingNo"),
			new ZollerProperty("DrawingIndex"),
			new ZollerProperty("Operation"),
			new ZollerProperty("RawPartNo"),
			new ZollerProperty("RawPartDimensions"),
			new ZollerProperty("ClampingDescription"),
			new ZollerProperty("CycleTime"),
			new ZollerProperty("CasetteNo"),
			new ZollerProperty("Material"),
			new ZollerProperty("MainTime"),
			new ZollerProperty("PartNo"),
			new ZollerProperty("NonproductiveTime"),
			new ZollerProperty("ToolingTime"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("InvMode"),
			new ZollerProperty("InvPhysical"),
			new ZollerProperty("InvFullCopy"),
			new ZollerProperty("LongComment"),
			new ZollerProperty("SettingSheetInv"),
			new ZollerProperty("NCProgrammNo"),
			new ZollerProperty("PostProcessorId"),
			new ZollerProperty("PostProcessorAdditionalPath"),
			new ZollerProperty("PostProcessorOption1"),
			new ZollerProperty("FixtureName"),
			new ZollerProperty("FixtureNo"),
			new ZollerProperty("FixtureDrawingFilePath"),
			new ZollerProperty("Department"),
			new ZollerProperty("Programmer"),
			new ZollerProperty("MachineName"),
			new ZollerProperty("ShortComment"),
			new ZollerProperty("WorkpieceDrawingFilePath"),
			new ZollerProperty("ExternalDocumentRef"),
			new ZollerProperty("M2AdditionalData"),
			new ZollerProperty("MaterialRef"),
			new ZollerProperty("M2TS"),
			new ZollerProperty("DepartmentRef"),
			new ZollerProperty("PalletNo"),
			new ZollerProperty("FixtureName2"),
			new ZollerProperty("FixtureNo2"),
			new ZollerProperty("FixtureDrawingFilePath2"),
			new ZollerProperty("PalletNo2"),
			new ZollerProperty("VolumeModelFilePath"),
			new ZollerProperty("SettingUpFilePath"),
			new ZollerProperty("CamInfoFilePath"),
			new ZollerProperty("LockingPressure"),
			new ZollerProperty("LockingPressure2"),
			new ZollerProperty("InvDescrTxt"),
			new ZollerProperty("InvState"),
			new ZollerProperty("InvTS"),
			new ZollerProperty("FG8MWearOnINT")
		],
		SubTypes: [
			"Machine",
			"Department",
			"Material",
			"Adapter"
		],
		EnumerableTypes: [
			new ZollerEnumType("ToolList", "Tool", [new ZollerProperty("Position"), new ZollerProperty("Quantity")]),
			new ZollerEnumType("FixtureList", "Fixture", [new ZollerProperty("Position")]),
			new ZollerEnumType("MeasuringDeviceV2List", "MeasuringDeviceV2", [new ZollerProperty("Position")]),
			new ZollerEnumType("ExternalDocumentRef", "ExternalDocument", [new ZollerProperty("Position")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			ExportObjectsWithGroup: false,
			LoadMachineReferenceLists: false,
			SettingSheetBaseDataOnly: false
		}
	},
	Tool: {
		Name: "Tool",
		Properties: [
			new ZollerProperty("ToolId"),
			new ZollerProperty("Description"),
			new ZollerProperty("Quantity"),
			new ZollerProperty("TNo"),
			new ZollerProperty("LongComment"),
			new ZollerProperty("Wobble"),
			new ZollerProperty("DxfDisplayMode"),
			new ZollerProperty("VerifiedForMeasuring"),
			new ZollerProperty("IsLifetimeExpired"),
			new ZollerProperty("DxfDoMirrowX"),
			new ZollerProperty("DxfDoMirrowY"),
			new ZollerProperty("DxfDoRotate"),
			new ZollerProperty("DxfRotateAngl"),
			new ZollerProperty("AxialRunOut"),
			new ZollerProperty("IsPartsExpired"),
			new ZollerProperty("UseTurningAdvisor"),
			new ZollerProperty("TAAdapterSwapped"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("InvMode"),
			new ZollerProperty("InvPhysical"),
			new ZollerProperty("InvFullCopy"),
			new ZollerProperty("UsedAdapterId"),
			new ZollerProperty("UsedAdapterName"),
			new ZollerProperty("SVG"),
			new ZollerProperty("ToolInv"),
			new ZollerProperty("Weight"),
			new ZollerProperty("Lifetime"),
			new ZollerProperty("RemainingLifetime"),
			new ZollerProperty("WarningLimit"),
			new ZollerProperty("WarningLimit2"),
			new ZollerProperty("MagazinPosition"),
			new ZollerProperty("Type"),
			new ZollerProperty("CrossStaff"),
			new ZollerProperty("DuploNo"),
			new ZollerProperty("CollisionL1"),
			new ZollerProperty("CollisionL2"),
			new ZollerProperty("CollisionR1"),
			new ZollerProperty("CollisionR2"),
			new ZollerProperty("SizeClass"),
			new ZollerProperty("Tag"),
			new ZollerProperty("Code"),
			new ZollerProperty("FacingHead"),
			new ZollerProperty("SpindlePower"),
			new ZollerProperty("Multispindle"),
			new ZollerProperty("ChangeSpeed"),
			new ZollerProperty("Torque"),
			new ZollerProperty("ColourCode"),
			new ZollerProperty("Direction"),
			new ZollerProperty("BreakLimit"),
			new ZollerProperty("Coolant"),
			new ZollerProperty("WeightClass"),
			new ZollerProperty("FeedRate"),
			new ZollerProperty("ResidenceType"),
			new ZollerProperty("Wear"),
			new ZollerProperty("HandleGroup"),
			new ZollerProperty("SpecialTool"),
			new ZollerProperty("MeasurementUtils"),
			new ZollerProperty("DxfPathFile"),
			new ZollerProperty("DxfDisplayAuto"),
			new ZollerProperty("DxfTrimmingX"),
			new ZollerProperty("DxfTrimmingY"),
			new ZollerProperty("AszaPinNumber"),
			new ZollerProperty("DxfPathFileOutput"),
			new ZollerProperty("DxfDrmPathFile"),
			new ZollerProperty("DxfDrmDisplayMode"),
			new ZollerProperty("DxfDrmDisplayAuto"),
			new ZollerProperty("DxfDrmTrimmingX"),
			new ZollerProperty("DxfDrmTrimmingY"),
			new ZollerProperty("DxfDrmPathFileOutput"),
			new ZollerProperty("TNoString"),
			new ZollerProperty("ToolCasetteNo"),
			new ZollerProperty("ToolAngleNominal"),
			new ZollerProperty("ToolDiameterNominal"),
			new ZollerProperty("StickingOut"),
			new ZollerProperty("HolderLength"),
			new ZollerProperty("HolderDiameter"),
			new ZollerProperty("LifetimeCondition"),
			new ZollerProperty("AxialRunOutZ"),
			new ZollerProperty("AxialRunOutX"),
			new ZollerProperty("SwitchLengthUnit"),
			new ZollerProperty("SwitchAngleUnit"),
			new ZollerProperty("ScannerVectorGraphic"),
			new ZollerProperty("ScalableVectorGraphicNominal"),
			new ZollerProperty("ScalableVectorGraphic"),
			new ZollerProperty("CazToolOptions"),
			new ZollerProperty("CollectedId"),
			new ZollerProperty("CollectedComment"),
			new ZollerProperty("ActualLifetime"),
			new ZollerProperty("Grinder"),
			new ZollerProperty("Parts"),
			new ZollerProperty("RemainingParts"),
			new ZollerProperty("PartsWarningLimit"),
			new ZollerProperty("Comment"),
			new ZollerProperty("Operation"),
			new ZollerProperty("WorkStep"),
			new ZollerProperty("Supplier"),
			new ZollerProperty("WobbleDataRef"),
			new ZollerProperty("MachineRef"),
			new ZollerProperty("ExternalDocumentRef"),
			new ZollerProperty("M2AdditionalData"),
			new ZollerProperty("M2AdditionalInvData"),
			new ZollerProperty("Price"),
			new ZollerProperty("CharacteristicDataRef"),
			new ZollerProperty("RtlChangeReason"),
			new ZollerProperty("TechnologyDataRef"),
			new ZollerProperty("M2TS"),
			new ZollerProperty("RtlChangeReason2"),
			new ZollerProperty("CharacteristicDataRef1"),
			new ZollerProperty("CharacteristicDataRef2"),
			new ZollerProperty("CharacteristicDataRef3"),
			new ZollerProperty("CharacteristicDataRef4"),
			new ZollerProperty("StorageBookingRef"),
			new ZollerProperty("TechnologyV2DataRef"),
			new ZollerProperty("ActualParts"),
			new ZollerProperty("CharacteristicDataRef5"),
			new ZollerProperty("CharacteristicDataRef6"),
			new ZollerProperty("CharacteristicDataRef7"),
			new ZollerProperty("CharacteristicDataRef8"),
			new ZollerProperty("CharacteristicDataRef9"),
			new ZollerProperty("CharacteristicDataRef10"),
			new ZollerProperty("CharacteristicDataRef11"),
			new ZollerProperty("CharacteristicDataRef12"),
			new ZollerProperty("CharacteristicDataRef13"),
			new ZollerProperty("CharacteristicDataRef14"),
			new ZollerProperty("TurningAdvisorDataInvRef"),
			new ZollerProperty("LifeCycleBaseDataRef"),
			new ZollerProperty("NCDirection"),
			new ZollerProperty("NCAnchorMark"),
			new ZollerProperty("InvDescrTxt"),
			new ZollerProperty("InvState"),
			new ZollerProperty("InvTS"),
			new ZollerProperty("StorageLocation"),
			new ZollerProperty("CazOffsetZ"),
			new ZollerProperty("CazOffsetX"),
			new ZollerProperty("TestProtocolFile"),
			new ZollerProperty("M2TextField11"),
			new ZollerProperty("M2TextField12"),
			new ZollerProperty("M2TextField13"),
			new ZollerProperty("M2TextField14"),
			new ZollerProperty("M2TextField21"),
			new ZollerProperty("M2TextField22"),
			new ZollerProperty("M2TextField23"),
			new ZollerProperty("M2TextField24"),
			new ZollerProperty("M2TextField31"),
			new ZollerProperty("M2TextField32"),
			new ZollerProperty("M2TextField33"),
			new ZollerProperty("M2TextField34"),
			new ZollerProperty("M2TextField41"),
			new ZollerProperty("M2TextField42"),
			new ZollerProperty("M2TextField43"),
			new ZollerProperty("M2TextField44"),
			new ZollerProperty("M2TextField51"),
			new ZollerProperty("M2TextField52"),
			new ZollerProperty("M2TextField53"),
			new ZollerProperty("M2TextField54"),
			new ZollerProperty("MagnetFinishToolName"),
			new ZollerProperty("MagnetFinishP1"),
			new ZollerProperty("MagnetFinishP2"),
			new ZollerProperty("MagnetFinishP3"),
			new ZollerProperty("MagnetFinishP4"),
			new ZollerProperty("MagnetFinishP5"),
			new ZollerProperty("MagnetFinishP6"),
			new ZollerProperty("MagnetFinishP7"),
			new ZollerProperty("MagnetFinishP8"),
			new ZollerProperty("MagnetFinishComment")
		],
		SubTypes: [
			"Article"
		],
		EnumerableTypes: [
			new ZollerEnumType("ExternalDocumentRef", "ExternalDocument", [new ZollerProperty("Position")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			Contour: "",
			exportScanningResult: false,
			ExportObjectsWithGroup: false,
			LoadMachineReferenceLists: false,
			LoadStorageBookingData: false,
			LoadSubData: false
		}
	},
	Component: {
		Name: "Component",
		Properties: [
			new ZollerProperty("ComponentId"),
			new ZollerProperty("Description"),
			new ZollerProperty("Quantity"),
			new ZollerProperty("PartClass"),
			new ZollerProperty("Fabrication"),
			new ZollerProperty("Norm"),
			new ZollerProperty("SubjectNo"),
			new ZollerProperty("Grade"),
			new ZollerProperty("Weight"),
			new ZollerProperty("RotationSpeedMax"),
			new ZollerProperty("Comment"),
			new ZollerProperty("Supplier"),
			new ZollerProperty("OrderNo"),
			new ZollerProperty("UnitPrice"),
			new ZollerProperty("MinimumInventory"),
			new ZollerProperty("OrderAmount"),
			new ZollerProperty("DeliveryTime"),
			new ZollerProperty("ConnectionPoint1"),
			new ZollerProperty("ConnectionPoint2"),
			new ZollerProperty("LongComment"),
			new ZollerProperty("StorageUse"),
			new ZollerProperty("InterfaceCodingMachineSide"),
			new ZollerProperty("CouplingMachineSideDiam"),
			new ZollerProperty("InterfaceCodingToolSide"),
			new ZollerProperty("CouplingToolSideMinClampDiam"),
			new ZollerProperty("CouplingToolSideMaxClampDiam"),
			new ZollerProperty("GeneratedInterfaceCodingMachineSide"),
			new ZollerProperty("GeneratedInterfaceCodingToolSide"),
			new ZollerProperty("CouplingUseCharacteristic"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("InvMode"),
			new ZollerProperty("InvPhysical"),
			new ZollerProperty("InvFullCopy"),
			new ZollerProperty("SVG"),
			new ZollerProperty("Grinder"),
			new ZollerProperty("InvDescrTxt"),
			new ZollerProperty("InvState"),
			new ZollerProperty("InvTS"),
			new ZollerProperty("LifeCycleBaseDataRef"),
			new ZollerProperty("LifeCyclePartialDataRef"),
			new ZollerProperty("ComponentInv"),
			new ZollerProperty("ConnectionPointXN"),
			new ZollerProperty("ConnectionPointXNT"),
			new ZollerProperty("ConnectionPointXPT"),
			new ZollerProperty("ConnectionPointZN"),
			new ZollerProperty("ConnectionPointZNT"),
			new ZollerProperty("ConnectionPointZPT"),
			new ZollerProperty("CouplingRefMachineSide"),
			new ZollerProperty("CouplingRefToolSide"),
			new ZollerProperty("CuttingMaterialRef"),
			new ZollerProperty("ExternalDocumentRef"),
			new ZollerProperty("MaterialRef"),
			new ZollerProperty("ScalableVectorGraphic"),
			new ZollerProperty("StorageBookingRef"),
			new ZollerProperty("StorageLocation"),
			new ZollerProperty("SwitchAngleUnit"),
			new ZollerProperty("SwitchLengthUnit"),
			new ZollerProperty("TDContourGraphicGenerated"),
			new ZollerProperty("TDContourGraphicGenerationId"),
			new ZollerProperty("TDContourGraphicGenerationView"),
			new ZollerProperty("TechnologyDataRef"),
			new ZollerProperty("TechnologyV2DataRef"),
			new ZollerProperty("CharacteristicDataRef"),
			new ZollerProperty("CharacteristicDataRef1"),
			new ZollerProperty("CharacteristicDataRef2"),
			new ZollerProperty("CharacteristicDataRef3"),
			new ZollerProperty("CharacteristicDataRef4"),
			new ZollerProperty("CharacteristicDataRef5"),
			new ZollerProperty("CharacteristicDataRef6"),
			new ZollerProperty("CharacteristicDataRef7"),
			new ZollerProperty("CharacteristicDataRef8"),
			new ZollerProperty("CharacteristicDataRef9"),
			new ZollerProperty("CharacteristicDataRef10"),
			new ZollerProperty("CharacteristicDataRef11"),
			new ZollerProperty("CharacteristicDataRef12"),
			new ZollerProperty("CharacteristicDataRef13"),
			new ZollerProperty("CharacteristicDataRef14")
		],
		SubTypes: [
			"Article"
		],
		EnumerableTypes: [
			new ZollerEnumType("ExternalDocumentRef", "ExternalDocument", [new ZollerProperty("Position")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			ExportObjectsWithGroup: false,
			LoadSubData: false
		}
	},
	Accessory: {
		Name: "Accessory",
		Properties: [
			new ZollerProperty("AccessoryId"),
			new ZollerProperty("Description"),
			new ZollerProperty("Quantity"),
			new ZollerProperty("LongComment"),
			new ZollerProperty("Standard"),
			new ZollerProperty("Lifetime")
		],
		SubTypes: [
			"Article"
		],
		EnumerableTypes: [
			new ZollerEnumType("ExternalDocumentRef", "ExternalDocument", [new ZollerProperty("Position")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			ExportObjectsWithGroup: false,
			LoadStorageBookingData: false,
			LoadSubData: false,
			ExportParentObjectReferenceList: false
		}
	},
	Fixture: {
		Name: "Fixture",
		Properties: [
			new ZollerProperty("FixtureId"),
			new ZollerProperty("Description"),
			new ZollerProperty("Quantity"),
			new ZollerProperty("ClampingDescription"),
			new ZollerProperty("DrawingNo"),
			new ZollerProperty("Weight"),
			new ZollerProperty("IsFixtureActive"),
			new ZollerProperty("IsSubFixture"),
			new ZollerProperty("StorageLocation"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("InvMode"),
			new ZollerProperty("InvPhysical"),
			new ZollerProperty("InvFullCopy"),
			new ZollerProperty("LongComment")
		],
		SubTypes: [
			"Article"
		],
		EnumerableTypes: [
			new ZollerEnumType("ExternalDocumentRef", "ExternalDocument", [new ZollerProperty("Position")]),
			new ZollerEnumType("FixtureSubList", "Fixture", [new ZollerProperty("Position"),new ZollerProperty("Quantity")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	MeasuringDeviceV2: {
		Name: "MeasuringDeviceV2",
		Properties: [
			new ZollerProperty("MeasuringDeviceId"),
			new ZollerProperty("Description"),
			new ZollerProperty("IsCalibrator"),
			new ZollerProperty("InternalTest"),
			new ZollerProperty("CheckDateInterval"),
			new ZollerProperty("CheckUsageCount"),
			new ZollerProperty("MeasuringDeviceStateAfterCalibration"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("MeasuringRangeMin"),
			new ZollerProperty("MeasuringRangeMax"),
			new ZollerProperty("MainTestValue"),
			new ZollerProperty("MeasuringDeviceType"),
			new ZollerProperty("MainTestValueUpperTol"),
			new ZollerProperty("MainTestValueLowerTol"),
			new ZollerProperty("MeasuringPrecision"),
			new ZollerProperty("InvFullCopy")
		],
		SubTypes: [
			"Employee",
			"Department",
			"TestHistory",
			"Article"
		],
		EnumerableTypes: [
			new ZollerEnumType("ExternalDocumentRef", "ExternalDocument", [new ZollerProperty("Position")]),
			new ZollerEnumType("ExternalDocumentInvRef", "ExternalDocument", [new ZollerProperty("Position")])
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Storage: {
		Name: "Storage",
		Properties: [
			new ZollerProperty("StorageId"),
			new ZollerProperty("StorageName"),
			new ZollerProperty("Width"),
			new ZollerProperty("Height"),
			new ZollerProperty("Depth"),
			new ZollerProperty("ExternalSystemControl"),
			new ZollerProperty("Type"),
			new ZollerProperty("CirculationControl"),
			new ZollerProperty("IsStockOrderNeeded"),
			new ZollerProperty("DatasetState")
		],
		SubTypes: [
			"CostCenter",
			"StoragePlace"
		],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	StoragePlace: {
		Name: "StoragePlace",
		Properties: [
			new ZollerProperty("StoragePlaceBaseId"),
			new ZollerProperty("Description")
		],
		SubTypes: [],
		EnumerableTypes: []
	},
	Department: {
		Name: "Department",
		Properties: [
			new ZollerProperty("DepartmentId"),
			new ZollerProperty("Description"),
			new ZollerProperty("Comment"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("LongComment")
		],
		SubTypes: [
			"CostCenter",
			"Contact",
			"Employee"
		],
		EnumerableTypes: [
			new ZollerEnumType("EmployeeRef", "Employees")
		],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Document: {
		Name: "Document",
		Properties: [
			new ZollerProperty("DocumentId"),
			new ZollerProperty("CreationTime"),
			new ZollerProperty("LastModified"),
			new ZollerProperty("DocumentSize"),
			new ZollerProperty("DocumentMimeType"),
			new ZollerProperty("DocumentLocation"),
			new ZollerProperty("DocumentUri")
		],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	ExternalDocument: {
		Name: "Document",
		Properties: [
			new ZollerProperty("DocumentUri"),
			new ZollerProperty("ExternalViewer")
		],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Employees: {
		Name: "Employees",
		Properties: [
			new ZollerProperty("EmployeesId"),
			new ZollerProperty("LastName"),
			new ZollerProperty("FirstName"),
			new ZollerProperty("Title"),
			new ZollerProperty("EntryDate"),
			new ZollerProperty("Token"),
			new ZollerProperty("Function"),
			new ZollerProperty("DateOfBirth"),
			new ZollerProperty("DatasetState"),
			new ZollerProperty("LongComment")
		],
		SubTypes: [
			"CostCenter",
			"Contact"
		],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			ExportObjectsWithGroup: false,
			LoadSubData: true
		}
	}	,
	Supplier: {
		Name: "Supplier",
		Properties: [],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false,
			ExportObjectsWithGroup: false,
			LoadSubData: false
		}
	},
	MeasureHistory: {
		Name: "MeasureHistory",
		Properties: [],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Material: {
		Name: "Material",
		Properties: [],
		SubTypes: [
			"ChippingGroup"
		],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	ChippingGroup: {
		Name: "ChippingGroup",
		Properties: [],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Currency: {
		Name: "Currency",
		Properties: [],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	CostCenter: {
		Name: "CostCenter",
		Properties: [],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Contact: {
		Name: "Contact",
		Properties: [			new ZollerProperty("Street"),			new ZollerProperty("ZipCode"),			new ZollerProperty("City"),			new ZollerProperty("CityAppendix"),			new ZollerProperty("Country"),			new ZollerProperty("TelefonNr"),			new ZollerProperty("Telefon2Nr"),			new ZollerProperty("TelefonPrivate"),			new ZollerProperty("TelefonMobil"),			new ZollerProperty("FaxNr"),			new ZollerProperty("FaxPrivate"),			new ZollerProperty("Email"),			new ZollerProperty("Homepage"),			new ZollerProperty("FirstName"),			new ZollerProperty("LastName"),			new ZollerProperty("PostOfficeBoxZipCode"),			new ZollerProperty("PostOfficeBox"),			new ZollerProperty("Title"),			new ZollerProperty("Name"),			new ZollerProperty("DeliveryStreet"),			new ZollerProperty("DeliveryZipCode"),			new ZollerProperty("DeliveryCity"),			new ZollerProperty("DeliveryCityAppendix"),			new ZollerProperty("DeliveryCountry"),			new ZollerProperty("DeliveryPostOfficeBoxZipCode"),			new ZollerProperty("DeliveryPostOfficeBox"),			new ZollerProperty("DeliveryName"),
			new ZollerProperty("Function")
		],
		SubTypes: [],
		EnumerableTypes: [],
		Settings: {
			DontExportDefaultValues: false,
			ExportEmptyFields: false,
			ExportWithObjIdAndObjInv: false
		}
	},
	Article: {
		Name: "Article",
		Properties: [
			new ZollerProperty("MinimumStore"),
			new ZollerProperty("Cost"),
			new ZollerProperty("DeliveryTime"),
			new ZollerProperty("StandardOrderVol"),
			new ZollerProperty("Unit"),
			new ZollerProperty("CheckRule"),
			new ZollerProperty("ERPArticleNo"),
			new ZollerProperty("ResolveModeArticleOrder"),
			new ZollerProperty("ResolveModeInventory"),
			new ZollerProperty("ResolveModeJobOrderPlanning"),
			new ZollerProperty("ResolveModeStorageBooking"),
			new ZollerProperty("ToolCategory"),
			new ZollerProperty("ManufacturerArticleNo"),
			new ZollerProperty("MovingAveragePrice"),
			new ZollerProperty("CornerCount"),
			new ZollerProperty("MaintenanceCount"),
			new ZollerProperty("MaintenancePrice"),
			new ZollerProperty("OrderPositionComment"),
			new ZollerProperty("CurrencyRef"),
			new ZollerProperty("ManufacturerRef")
		],
		SubTypes: [
			"Manufacturer",
			"Currency"
		],
		EnumerableTypes: [
			new ZollerEnumType("ComponentList", "Component", [new ZollerProperty("UseAtGraphicAssembling"), new ZollerProperty("Position"), new ZollerProperty("Quantity")]),
			new ZollerEnumType("AccessoryList", "Accessory", [new ZollerProperty("Position"), new ZollerProperty("Quantity")]),
			new ZollerEnumType("ArticleSupplierList", "Supplier")
		]
	}
}
function ContainsProperty(type, name){
	for (var len = type.Properties.length, n = 0; n < len; n++){
		if (type.Properties[n].Name == name){
			return true;
		}
	}
	return false;
}
function ContainsEnum(type, root){
	for (var len = type.EnumerableTypes.length, n = 0; n < len; n++){
		if (type.EnumerableTypes[n].Root == root){
			return true;
		}
	}
	return false;
}
function GetProperty(type, name){
	for (var len = type.Properties.length, n = 0; n < len; n++){
		if (type.Properties[n].Name == name){
			return type.Properties[n];
		}
	}
	return undefined;
}
function GetEnum(type, root){
	for (var len = type.EnumerableTypes.length, n = 0; n < len; n++){
		if (type.EnumerableTypes[n].Root == root){
			return type.EnumerableTypes[n];
		}
	}
	return undefined;
}

function ZollerProperty(nodeText, altLabel, canDraw){
	this.Name = nodeText;
	if (altLabel != undefined){
		this.Label = altLabel;
	}else{
		this.Label = nodeText;
	}
	if (canDraw != undefined){
		this.CanDraw = canDraw;
	}else{
		this.CanDraw = false; // Default to not drawing
	}
}
function ZollerEnumType(root, nodeText, props){
	this.Root = root;
	this.Name = nodeText;
	this.Properties = new Array();
	if (props != undefined && props.length > 0){
		for (var len = props.length, n = 0; n < len; n++){
			this.Properties.push(props[n]);
		}
	}
}


function ZollerAdapter(id) {
	// Object Properties
	this.isNull = true;
	this.ZollerProperties = {
		AdapterId:"",
		Name:"",
		AdapterType:"",
		AdapterPresetter:{
			CES:"",
			Focus:"",
			MsrRangeWidth:"",
			IsTurnable:"",
			IsDriven:"",
			IsHSKAdapter:"",
			TIReindexSpindle:"",
			CheckToolClamp:"",
			ZRefMode:"",
			ZDiaMode:"",
			XRefMode:"",
			XDiaMode:"",
			UseMode:"",
			RunOutDoCorrection:"",
			AxialRadialRunOutDoCorrection:"",
			DetectAdapterCenter:"",
			BarcodeDoRotation:"",
			BarcodeManualIllumination:""
		}
	}
	this.CustomProperties = {};
	this.AdditionalData = {};
	this.Images = [];

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Accessory: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Adapter");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		zp.AdapterId = getValue(node, "AdapterId", "Adapter.");
		zp.Name = getValue(node, "Name", "Adapter.");
		zp.AdapterType = getValue(node, "AdapterType", "Adapter.");
		var adapPres = getNodeByTagName(node, "AdapterPresetter", "Adapter.");
		var adapPresProps = Object.getOwnPropertyNames(zp.AdapterPresetter);
		for (var len = adapPresProps.length, n = 0; n < len; n++){
			zp.AdapterPresetter[adapPresProps[n]] = getValue(adapPres, adapPresProps[n], "Adapter.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			// Iterate through the main nodes first as there are more nodes than suffixes
			if (node.children[n].tagName.indexOf("AdapterPresetter") >= 0) {
				for (var blen = node.children[n].children.length, k = 0; k < blen; k++) {
					for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
						// Iterate through the possible suffixes to see if the current node matches
						if (node.children[n].children[k].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
							this.Images.push(new ZollerGraphicImage(node.children[n].children[k].innerHTML, node.children[n].children[k + 1].innerHTML));
						}
					}
				}
			}else{
				if (zp[node.children[n].tagName.replace("Adapter.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML = undefined;
  this.SetXML = function (xml) {
		if (_Verbose){console.log("Setting XML: ",this)}
		this.XML = xml;
		this.Initialize();
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Adapter/" + id + "?LoadSubData=true", this.SetXML); // Must specify context for Initialization to work after SetXML
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerMachine(id) {
	this.isNull = true;
	this.ZollerProperties = {
		MachineId:"",
		Name:"",
		Description:"",
		MagazineCapacity:"",
		NCToDirectory:"",
		NCFromDirectory:"",
		Type:"",
		Manufacturer:"",
		FactoryNo:"",
		InventoryNo:"",
		MachineGroupField:"",
		YearOfConstruction:"",
		CommissioningDate:"",
		Label:"",
		DeliveryDate:"",
		MachineLocation:"",
		PlaceNo:"",
		Dimension:"",
		Weight:"",
		AreaRequirement:"",
		FundamentNo:"",
		ElectricStreamplanNo:"",
		TotalConnectionValue:"",
		TotalPower:"",
		Voltage:"",
		Frequency:"",
		HourlyRate:""
	}
	this.CustomProperties = {};
	this.AdditionalData = {};
	this.Images = [];
	this.Tools = [];
	this.SettingSheets = [];
	this.Accessories = [];
	this.Adapters = [];
	this.Documents = [];
	this.CustomProperties = {};
  
	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Machine: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Machine", "Machine.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "Machine.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			if (node.children[n].tagName == "MachineToolList") {// Get Components and Tools of the Machine
				var cmpnts = getNodes(node.children[n], "Tool");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Tools.push(new ZollerTool(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No tools found in ToolList Data");
				}
			}else if (node.children[n].tagName.indexOf("SettingSheetList") >= 0) {// Get SettingSheets of the Machine
				var cmpnts = getNodes(node.children[n], "SettingSheet");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.SettingSheets.push(new ZollerSettingSheet(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No settingsheets found in SettingSheet Data");
				}
			}else if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Machine
				var cmpnts = getNodes(node.children[n], "Document");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No documents found in ExternalDocument Data");
				}
			}else if (node.children[n].tagName.indexOf("MachineAccessoryList") >= 0) {// Get Accessories of the Machine
				var cmpnts = getNodes(node.children[n], "Accessory");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No accessories found in Accessory Data");
				}
			}else if (node.children[n].tagName.indexOf("MachineAdapterList") >= 0) {// Get Adapters of the Machine
				var cmpnts = getNodes(node.children[n], "Adapter");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Adapters.push(new ZollerAdapter(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No accessories found in Adapter Data");
				}
			}else{
				var blnGraphicsFound = false;
				// Iterate through the main nodes first as there are more nodes than suffixes
				for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
					// Iterate through the possible suffixes to see if the current node matches
					if (node.children[n].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
						this.Images.push(new ZollerGraphicImage(node.children[n].innerHTML, node.children[n + 1].innerHTML));
						blnGraphicsFound = true;
						break;
					}
				}
				if (!blnGraphicsFound && zp[node.children[n].tagName.replace("Machine.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Machine/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerSettingSheet(id) {
	this.isNull = true;
	this.ZollerProperties = {
		SettingSheetId:"",
		Name:"",
		WorkStep:"",
		ArticleNo:"",
		CostCenter:"",
		DrawingNo:"",
		DrawingIndex:"",
		Operation:"",
		RawPartNo:"",
		RawPartDimensions:"",
		ClampingDescription:"",
		CycleTime:"",
		CasetteNo:"",
		Material:"",
		MainTime:"",
		PartNo:"",
		NonproductiveTime:"",
		ToolingTime:"",
		DatasetState:"",
		InvMode:"",
		InvPhysical:"",
		InvFullCopy:"",
		LongComment:""
	}
	this.Machine;
	this.Department;
	this.Material;
	this.Images = [];
	this.Tools = [];
	this.Fixtures = [];
	this.MeasuringDevicesV2 = [];
	this.Documents = [];
	this.CustomProperties = {};
	this.AdditionalData = {};

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing SettingSheet: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "SettingSheet", "SettingSheet.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "SettingSheet.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			if (node.children[n].tagName.indexOf("Machine") >= 0) {// Get Machine of the SettingSheet
				this.Machine = new ZollerMachine(node.children[n]);
			}else if (node.children[n].tagName.indexOf("ToolList") >= 0) {// Get Components and Tools of the SettingSheet
				var cmpnts = getNodes(node.children[n], "Tool");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Tools.push(new ZollerTool(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No tools found in ToolList Data");
				}
			}else if (node.children[n].tagName.indexOf("FixtureList") >= 0) {// Get Fixtures of the SettingSheet
				var fixts = getNodes(node.children[n], "FixtureInList", "SettingSheet.");
				if (fixts != undefined) {
					for (var clen = fixts.length, i = 0; i < clen; i++) {
						var fixt = new ZollerSubFixture();
						fixt.Position = getValue(fixts[i], "Position");
						fixt.Quantity = getValue(fixts[i], "Quantity");
						fixt.Fixture = new ZollerFixture(getNodeByTagName(fixts[i], "Fixture", "SettingSheet."));
						this.Fixtures.push(fixt);
					}
				} else {
					console.log("No fixtures found in FixtureList Data");
				}
			}else if (node.children[n].tagName.indexOf("MeasuringDeviceV2List") >= 0) {// Get MeasuringDeviceV2 of the SettingSheet
				var meass = getNodes(node.children[n], "MeasuringDeviceV2InList", "SettingSheet.");
				if (meass != undefined) {
					for (var clen = meass.length, i = 0; i < clen; i++) {
						var meas = new ZollerSubMeasuringDeviceV2();
						meas.Position = getValue(meass[i], "Position", "SettingSheet.");
						meas.Quantity = getValue(meass[i], "Quantity", "SettingSheet.");
						meas.MeasuringDeviceV2 = new ZollerMeasuringDeviceV2(getNodeByTagName(meass[i], "MeasuringDeviceV2", "SettingSheet."));
						this.MeasuringDevicesV2.push(meas);
					}
				} else {
					console.log("No MeasuringDeviceV2 found in MeasuringDeviceV2List Data");
				}
			}else if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Tool
				var cmpnts = getNodes(node.children[n], "Document", "SettingSheet.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No documents found in ExternalDocument Data");
				}
			}else{
				var blnGraphicsFound = false;
				// Iterate through the main nodes first as there are more nodes than suffixes
				for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
					// Iterate through the possible suffixes to see if the current node matches
					if (node.children[n].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
						this.Images.push(new ZollerGraphicImage(node.children[n].innerHTML, node.children[n + 1].innerHTML));
						blnGraphicsFound = true;
						break;
					}
				}
				if (!blnGraphicsFound && zp[node.children[n].tagName.replace("SettingSheet.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "SettingSheet/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerTool(id) {
	this.isNull = true;
	this.ZollerProperties = {
		ToolId:"",
		Description:"",
		Quantity: 1,
		TNo:"",
		LongComment:"",
		Wobble:"",
		DxfDisplayMode:"",
		VerifiedForMeasuring:"",
		IsLifetimeExpired:"",
		DxfDoMirrowX:"",
		DxfDoMirrowY:"",
		DxfDoRotate:"",
		DxfRotateAngl:"",
		AxialRunOut:"",
		IsPartsExpired:"",
		UseTurningAdvisor:"",
		TAAdapterSwapped:"",
		DatasetState:"",
		InvMode:"",
		InvPhysical:"",
		InvFullCopy:"",
		UsedAdapterId:"",
		UsedAdapterName:"",
		SVG:null
	}
	this.CharacteristicStructures = [];
	this.Images = [];
	this.SingleComponents = [];
	this.Accessories = [];
	this.Documents = [];
	this.CustomProperties = {};
	this.AdditionalData = {};

	this.Initialize = function(){
		if (_Verbose){console.log("[ZollerTool.Initialize] Initializing Tool: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Tool", "Tool.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "Tool.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			if (node.children[n].tagName.indexOf("Characteristic") >= 0) {
				this.CharacteristicStructures.push(new ZollerCharacteristicStructure(node.children[n]));
			}else if (node.children[n].tagName.indexOf("Article") >= 0) {// Get Components and Accessories of the Tool
				var cmpnts = getNodes(node.children[n], "Component", "Tool.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.SingleComponents.push(new ZollerSingleComponent(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
						this.SingleComponents[this.SingleComponents.length-1].IsTrueZoller = true;
					}
				} else {
					console.log("[ZollerTool.Initialize] No components found in Article Data");
				}
				cmpnts = getNodes(node.children[n], "Accessory", "Tool.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("[ZollerTool.Initialize] No accessories found in Article Data");
				}
			}else if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Tool
				var cmpnts = getNodes(node.children[n], "Document", "Tool.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("[ZollerTool.Initialize] No documents found in ExternalDocument Data");
				}
			}else{
				var blnGraphicsFound = false;
				// Iterate through the main nodes first as there are more nodes than suffixes
				for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
					// Iterate through the possible suffixes to see if the current node matches
					if (node.children[n].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
						this.Images.push(new ZollerGraphicImage(node.children[n].innerHTML, node.children[n + 1].innerHTML));
						blnGraphicsFound = true;
						break;
					}
				}
				if (!blnGraphicsFound && zp[node.children[n].tagName.replace("Tool.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		
		this.isNull = false;
		this.DrawHTML();
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  // This function generates the HTML to be added to the document. 'Size' represents the preferred sizing of the interface for the user. The available options are 'sm', 'md', and 'lg'. These can be adjusted in 'Zoller Interface.css'.
  this.DrawHTML = function (size, theme, parent, overwrite) {
		if (parent != undefined){this._DrawParent = parent}
		if (size != undefined){this._DrawSize = size}
		if (theme != undefined){this._DrawTheme = theme}
		if (overwrite != undefined){this._DrawOverwrite = overwrite}
		if (this.isNull){return null}
		var zp = this.ZollerProperties;
    var ass = document.createElement("div");
    ass.setAttribute("class", "assembly assembly-" + this._DrawSize + " theme-" + this._DrawTheme);

    var divName = document.createElement("div");
    divName.setAttribute("class", "assembly-name");
    divName.setAttribute("data-tool", zp.ToolId);
    divName.onclick = function () {
      this.classList.toggle("clicked");
    }
    var divId = document.createElement("span");
    divId.setAttribute("class", "id");
    divId.innerHTML = zp.ToolId;
    divId.setAttribute("title", "Tool Id: " + zp.ToolId);
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
    pName.setAttribute("title", zp.Description);
    pName.innerHTML = zp.Description;
    divName.appendChild(pName);

    var imgName = document.createElement("img");
		if (this.Images != undefined){
			if (this.Images.length > 0) {
				imgName.setAttribute("src", this.Images[0].ImageURL);
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
				divItem.setAttribute("data-tool", zp.ToolId);
				divItem.setAttribute("data-component", this.SingleComponents[n].ZollerProperties.ComponentId);
				divItem.setAttribute("draggable", ZollerGlobal.Graphics.AllowEdit); // Only draggable if the page allows editing.
				var aItem = document.createElement("a");
				var pId = document.createElement("p");
				pId.innerHTML = this.SingleComponents[n].ZollerProperties.ComponentId;
				pId.setAttribute("title", "Component Id");
				aItem.appendChild(pId);
				var pDescription = document.createElement("p");
				pDescription.innerHTML = this.SingleComponents[n].ZollerProperties.Description;
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
				// Add AutoCrib icon if necessary
				if (this.SingleComponents[n].ZollerProperties["Supplier"] === "AutoCrib"){
					var divAutoCrib = document.createElement("span");
					divAutoCrib.setAttribute("class", "autocrib");
					divAutoCrib.setAttribute("title", this.SingleComponents[n].ZollerProperties["OrderNo"]);
					divItem.appendChild(divAutoCrib);
				}
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

    if (typeof this._DrawParent !== "undefined" && this._DrawParent !== undefined) {
      if (this._DrawOverwrite !== undefined || this._DrawOverwrite == false) {
        var ex = this._DrawParent.querySelector("[data-tool='" + zp.ToolId + "']").parentElement;
        if (ex !== undefined) {
          this._DrawParent.insertBefore(ass, ex);
          this._DrawParent.removeChild(ex);
        } else {
          this._DrawParent.appendChild(ass);
        }
        ZollerGlobal.Set.Handlers();
      } else {
        this._DrawParent.appendChild(ass);
        ZollerGlobal.Set.Handlers();
      }
    }
    return ass;
  }

  //this.IsTrueZoller = false; // Custom property

  // This function can be altered to generate a custom XML structure to store Tool assemblies in non-Zoller storage. It is important that this is defined before SetXML() to avoid an undefined function.
  this.GetXML = function () {
		var out = [];
		//if (!this.IsTrueZoller){
		out.push("<Assembly id=\"" + this.ZollerProperties.ToolId + "\" name=\"" + this.ZollerProperties.Description.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\">");// iszoller=\"" + this.IsTrueZoller + "\"
		if (this.SingleComponents != undefined) {
			for (var len = this.SingleComponents.length, n = 0; n < len; n++) {
				out.push("<Tool id=\"" + this.SingleComponents[n].ZollerProperties.ComponentId + "\">");
				for (a = 0; a < this.SingleComponents[n].CharacteristicStructures.length; a++) {
					if (this.SingleComponents[n].CharacteristicStructures[a].System == "SSS") {
						for (b = 0; b < this.SingleComponents[n].CharacteristicStructures[a].Characteristics.length; b++) {
							out.push("<Characteristic label=\"" + this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Label.replace(/'/g, "&apos;").replace(/"/g, "&quot;") + "\">");
							out.push(this.SingleComponents[n].CharacteristicStructures[a].Characteristics[b].Value + "</Characteristics>");
						}
					}
				}
				if (this.SingleComponents[n].CustomProperties["Notes"] != undefined){
					out.push("<Notes>" + this.SingleComponents[n].CustomProperties.Notes + "</Notes>");
				}
				out.push("</Tool>");
			}
		}
		out.push("</Assembly>");
		//}
    return out.join("");
  }

  // Determine if the object is a valid Zoller object by attempting to get data from the Zoller WebService.
  //var nodeTool;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Tool/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not ready
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
  
	this.Convert = function(newUnits){
		for (var len = this.CharacteristicStructures.length, n = 0; n < len; n++){
			for (var clen = this.CharacteristicStructures[n].length, m = 0; m < clen; m++){
				this.CharacteristicStructures[n].Characteristics[m].Convert(newUnits);
			}
		}
	}
}

function ZollerSingleComponent(id) {
	this.isNull = true;
	this.ZollerProperties = {
		ComponentId:"",
		Description:"",
		Quantity:1,
		PartClass:"",
		Fabrication:"",
		Norm:"",
		SubjectNo:"",
		Grade:"",
		Weight:"",
		RotationSpeedMax:"",
		Comment:"",
		Supplier:"",
		OrderNo:"",
		UnitPrice:"",
		MinimumInventory:"",
		OrderAmount:"",
		DeliveryTime:"",
		ConnectionPoint1:"",
		ConnectionPoint2:"",
		LongComment:"",
		StorageUse:"",
		InterfaceCodingMachineSide:"",
		CouplingMachineSideDiam:"",
		InterfaceCodingToolSide:"",
		CouplingToolSideMinClampDiam:"",
		CouplingToolSideMaxClampDiam:"",
		GeneratedInterfaceCodingMachineSide:"",
		CouplingUseCharacteristic:"",
		DatasetState:"",
		InvMode:"",
		InvPhysical:"",
		InvFullCopy:"",
		SVG:null
	}
	this.CharacteristicStructures = [];
	this.Images = [];
	this.Accessories = [];
	this.Documents = [];
	this.CustomProperties = {};
	this.AdditionalData = {};

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing SingleComponent: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Component", "Component.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "Component.");
		}
		this.EDP = getValue(node, "SubjectNo", "Component."); // Custom property
		this.OrderCode = getValue(node, "Norm", "Component."); // Custom property
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			if (node.children[n].tagName.indexOf("Characteristic") >= 0) {
				this.CharacteristicStructures.push(new ZollerCharacteristicStructure(node.children[n]));
			}else if (node.children[n].tagName.indexOf("Article") >= 0) {// Get Accessories of the Single Component
				var cmpnts = getNodes(node.children[n], "Accessory", "Component.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No accessories found in Article Data");
				}
			}else if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Single Component
				var cmpnts = getNodes(node.children[n], "Document", "Component.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No documents found in ExternalDocument Data");
				}
			}else{
				var blnGraphicsFound = false;
				// Iterate through the main nodes first as there are more nodes than suffixes
				for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
					// Iterate through the possible suffixes to see if the current node matches
					if (node.children[n].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
						this.Images.push(new ZollerGraphicImage(node.children[n].innerHTML, node.children[n + 1].innerHTML));
						blnGraphicsFound = true;
						break;
					}
				}
				if (!blnGraphicsFound && zp[node.children[n].tagName.replace("Component.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		return this;
	}
  
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  // Determine if the object is a valid Zoller object by attempting to get data from the Zoller WebService.
  //var nodeComponent;
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Component/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); //Only async when not ready
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
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
	this.isNull = true;
	this.ZollerProperties = {
		AccessoryId:"",
		Description:"",
		Quantity:1,
		LongComment:"",
		Standard:"",
		Lifetime:""
	}
  this.Image = undefined;
  this.Documents = [];
	this.CustomProperties = {};
	this.AdditionalData = {};

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Accessory: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Accessory", "Accessory.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "Accessory.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			
			if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Tool
				var cmpnts = getNodes(node.children[n], "Document", "Accessory.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No documents found in ExternalDocument Data");
				}
			}else{
				var blnGraphicsFound = false;
				// Iterate through the main nodes first as there are more nodes than suffixes
				for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
					// Iterate through the possible suffixes to see if the current node matches
					if (node.children[n].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
						this.Image = new ZollerGraphicImage(node.children[n].innerHTML, node.children[n + 1].innerHTML);
						blnGraphicsFound = true;
						break;
					}
				}
				if (!blnGraphicsFound && zp[node.children[n].tagName.replace("Accessory.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.ZollerProperties.AccessoryId + "\"";
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
		if (parent != undefined){this._DrawParent = parent}
		if (size != undefined){this._DrawSize = size}
		if (theme != undefined){this._DrawTheme = theme}
		if (overwrite != undefined){this._DrawOverwrite = overwrite}
		if (this.isNull){return null}
		var zp = this.ZollerProperties;
    var divMain = document.createElement("div");
    divMain.setAttribute("class", "accessory accessory-" + this._DrawSize + " theme-" + this._DrawTheme);
    divMain.setAttribute("data-accessory", zp.AccessoryId);

    var divName = document.createElement("div");
    divName.setAttribute("class", "accessory-name");

    var pId = document.createElement("sup");
    pId.innerHTML = zp.AccessoryId;
    divName.appendChild(pId);

    var pDescription = document.createElement("p");
    pDescription.innerHTML = zp.Description;
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
    txt.value = zp.Standard;
    divDetails.appendChild(lbl);
    divDetails.appendChild(txt);

    var lbl = document.createElement("label");
    lbl.innerHTML = "Lifetime";
    var txt = document.createElement("input");
    txt.setAttribute("type", "text");
    txt.disabled = true;
    txt.value = zp.Lifetime;
    divDetails.appendChild(lbl);
    divDetails.appendChild(txt);

    var lbl = document.createElement("label");
    lbl.innerHTML = "Notes";
    var txt = document.createElement("textarea");
    txt.disabled = true;
    txt.value = zp.LongComment;
    divDetails.appendChild(lbl);
    divDetails.appendChild(txt);

    divMain.appendChild(divName);
    divMain.appendChild(divDetails);

    if (typeof this._DrawParent !== "undefined" && this._DrawParent !== undefined) {
      if (this._DrawOverwrite !== undefined || this._DrawOverwrite == false) {
        var ex = this._DrawParent.querySelector("[data-accessory='" + zp.AccessoryId + "']").parentElement;
        if (ex !== undefined) {
          this._DrawParent.insertBefore(divMain, ex);
          this._DrawParent.removeChild(ex);
        } else {
          this._DrawParent.appendChild(divMain);
        }
        ZollerGlobal.Set.Handlers();
      } else {
        this._DrawParent.appendChild(divMain);
        ZollerGlobal.Set.Handlers();
      }
    }
    return divMain;
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Accessory/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerFixture(id) {
	this.isNull = true;
	this.ZollerProperties = {
		FixtureId:"",
		Description:"",
		Quantity:1,
		ClampingDescription:"",
		DrawingNo:"",
		Weight:"",
		IsFixtureActive:"",
		IsSubFixture:"",
		StorageLocation:"",
		DatasetState:"",
		InvMode:"",
		InvPhysical:"",
		InvFullCopy:"",
		LongComment:""
	}
  this.Image = null;
  this.Fixtures = [];
  this.Accessories = [];
  this.Documents = [];
	this.CustomProperties = {};
	this.AdditionalData = {};

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Fixture: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Fixture", "Fixture.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "Fixture.");
		}
		this.Image = new ZollerGraphicImage(getValue(node, "GraphicFile", "Fixture."), getValue(node, "GraphicGroup", "Fixture."));
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			// Get Components and Accessories of the Fixture
			if (node.children[n].tagName.indexOf("Article") >= 0) {
				cmpnts = getNodes(node.children[n], "AccessoryInList", "Fixture.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						var aid = getValue(cmpnts[i], "AccessoryId", "Fixture.");
						if (aid != undefined && typeof aid != "undefined"){
							var nwSubAcc = new ZollerSubAccessory();
							nwSubAcc.Position = Number(getValue(cmpnts[i], "Position", "Fixture."));
							nwSubAcc.Quantity = Number(getValue(cmpnts[i], "Quantity", "Fixture."));
							nwSubAcc.Accessory = new ZollerAccessory(aid);
							this.Accessories.push(nwSubAcc);// Send XML structure. Only captured using LoadSubData query.
						}
					}
				} else {
					console.log("No accessories found in Article Data");
				}
			}else if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Fixture
				var cmpnts = getNodes(node.children[n], "Document", "Fixture.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No documents found in ExternalDocument Data");
				}
			}else if (node.children[n].tagName.indexOf("FixtureSubList") >= 0) {
				var subfixts = getNodes(node.children[n], "FixtureInList", "Fixture.");
				if (subfixts.length > 0){
					for (var flen = subfixts.length, m = 0; m < flen; m++) {
						//var fixtu = getNodeByTagName(subfixts[m],"Fixture");
						var fid = getValue(subfixts[m], "FixtureId", "Fixture.");
						if (fid != undefined && typeof fid != "undefined") {
							var nwSubFixtu = new ZollerSubFixture();
							nwSubFixtu.Position = Number(getValue(subfixts[m], "Position", "Fixture."));
							nwSubFixtu.Quantity = Number(getValue(subfixts[m], "Quantity", "Fixture."));
							nwSubFixtu.Fixture = new ZollerFixture(fid);
							this.Fixtures.push(nwSubFixtu);
						}
					}
				}
			}else{
				if (zp[node.children[n].tagName.replace("Fixture.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
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
		this.isNull = false;
		this.DrawHTML();
		this.DrawHTMLList();
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.ZollerProperties.FixtureId + "\"";
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
		if (parent != undefined){this._DrawParent = parent}
		if (size != undefined){this._DrawSize = size}
		if (theme != undefined){this._DrawTheme = theme}
		if (overwrite != undefined){this._DrawOverwrite = overwrite}
		if (this.isNull){return null}
		var zp = this.ZollerProperties;
    var fixt = document.createElement("div");
    fixt.setAttribute("class", "fixture fixture-" + this._DrawSize + " theme-" + this._DrawTheme);
    fixt.setAttribute("data-fixture", zp.FixtureId);
    var fixtCol1 = document.createElement("div");
    fixtCol1.setAttribute("class", "fixture-name");
    var fixtName = document.createElement("p");
    fixtName.innerHTML = "<sup>(" + zp.FixtureId + ")</sup> " + zp.Description;
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
    if (zp.LongComment != undefined && zp.LongComment != "") {
      fixtNotes.value = "[Zoller Comment] " + Convert.RTFToPlainText(zp.LongComment);
    } else if (zp.ClampingDescription != undefined && zp.ClampingDescription != "") {
      fixtNotes.value = "[Zoller Clamping] " + zp.ClampingDescription;
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
				var rtn = this.Fixtures[n].Fixture.DrawHTML("sm", theme);
				if (rtn != null){
        fixtCol3.appendChild(rtn);
				fixtCol3.childNodes[fixtCol3.childNodes.length-1].setAttribute("data-quantity",this.Fixtures[n].Quantity);
				}
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

    if (typeof this._DrawParent !== "undefined" && this._DrawParent !== undefined) {
      if (this._DrawOverwrite !== undefined || this._DrawOverwrite == false) {
        var ex = this._DrawParent.querySelector("[data-fixture='" + zp.FixtureId + "']").parentElement;
        if (ex !== undefined) {
          this._DrawParent.insertBefore(fixt, ex);
          this._DrawParent.removeChild(ex);
        } else {
          this._DrawParent.appendChild(fixt);
        }
        ZollerGlobal.Set.Handlers();
      } else {
        this._DrawParent.appendChild(fixt);
        ZollerGlobal.Set.Handlers();
      }
    }
    return fixt;
  }
	this.DrawHTMLList = function(size, theme, parent, overwrite) {
		if (parent != undefined){this._DrawParent = parent}
		if (size != undefined){this._DrawSize = size}
		if (theme != undefined){this._DrawTheme = theme}
		if (overwrite != undefined){this._DrawOverwrite = overwrite}
		if (this.isNull){return null}
		var zp = this.ZollerProperties;
    var fixt = document.createElement("li");
    fixt.setAttribute("class", "fixture fixture-" + this._DrawSize + " theme-" + this._DrawTheme);
    fixt.setAttribute("data-fixture", zp.FixtureId);
		
		var name = document.createElement("div");
		name.innerHTML = "<sup>[" + zp.FixtureId + "]</sup> " + zp.Description;
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

    if (typeof this._DrawParent !== "undefined" && this._DrawParent !== undefined) {
      if (this._DrawOverwrite !== undefined || this._DrawOverwrite == false) {
        var ex = this._DrawParent.querySelector("[data-fixture='" + zp.FixtureId + "']").parentElement;
        if (ex !== undefined) {
          this._DrawParent.insertBefore(fixt, ex);
          this._DrawParent.removeChild(ex);
        } else {
          this._DrawParent.appendChild(fixt);
        }
        ZollerGlobal.Set.Handlers();
      } else {
        this._DrawParent.appendChild(fixt);
        ZollerGlobal.Set.Handlers();
      }
    }
    return fixt;
	}
	
  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Fixture/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	this.Initialize();
}

function ZollerMeasuringDeviceV2(id) {
	this.isNull = true;
	this.ZollerProperties = {
		MeasuringDeviceId:"",
		Description:"",
		IsCalibrator:"",
		InternalTest:"",
		CheckDateInterval:"",
		CheckUsageCount:"",
		MeasuringDeviceStateAfterCalibration:"",
		DatasetState:"",
		MeasuringRangeMin:"",
		MeasuringRangeMax:"",
		MainTestValue:"",
		MeasuringDeviceType:"",
		MainTestValueUpperTol:"",
		MainTestValueLowerTol:"",
		MeasuringPrecision:"",
		InvFullCopy:""
	}
  this.Images = [];
  this.Accessories = [];
  this.Documents = [];
	this.CustomProperties = {};
	this.AdditionalData = {};

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing MeasuringDeviceV2: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "MeasuringDeviceV2", "MeasuringDeviceV2.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "MeasuringDeviceV2.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			if (node.children[n].tagName.indexOf("Article") >= 0) {// Get Components and Accessories of the Measuring Device
				cmpnts = getNodes(node.children[n], "Accessory", "MeasuringDeviceV2.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Accessories.push(new ZollerAccessory(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No accessories found in Article Data");
				}
			}else if (node.children[n].tagName.indexOf("ExternalDocument") >= 0) {// Get Documents of the Measuring Device
				var cmpnts = getNodes(node.children[n], "Document", "MeasuringDeviceV2.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						this.Documents.push(new ZollerDocument(cmpnts[i]));// Send XML structure. Only captured using LoadSubData query.
					}
				} else {
					console.log("No documents found in ExternalDocument Data");
				}
			}else{
				var blnGraphicsFound = false;
				// Iterate through the main nodes first as there are more nodes than suffixes
				for (var clen = ZollerGlobal.Graphics.Suffixes.length, i = 0; i < clen; i++) {
					// Iterate through the possible suffixes to see if the current node matches
					if (node.children[n].tagName.indexOf("GraphicFile" + ZollerGlobal.Graphics.Suffixes[i]) >= 0) {
						this.Images.push(new ZollerGraphicImage(node.children[n].innerHTML, node.children[n + 1].innerHTML));
						blnGraphicsFound = true;
						break;
					}
				}
				if (!blnGraphicsFound && zp[node.children[n].tagName.replace("MeasuringDeviceV2.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		this.DrawHTML();
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  this.GetJSON = function () {
    var out = "{\"id\":\"" + this.ZollerProperties.MeasuringDeviceId + "\"";
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
		if (this.isNull){return null}
		var zp = this.ZollerProperties;
    var meas = document.createElement("div");
    meas.setAttribute("class", "measure measure-" + size + " theme-" + theme);
    meas.setAttribute("data-measure", zp.MeasuringDeviceId);
    var measCol1 = document.createElement("div");
    measCol1.setAttribute("class", "measure-name");

    var measName = document.createElement("p");
    measName.innerHTML = "<sup>(" + zp.MeasuringDeviceId + ")</sup> " + zp.Description;
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
    if (this.CustomProperties.Notes != undefined && this.CustomProperties.Notes != "") {
      measNotes.value = this.CustomProperties.Notes;
    } else if (zp.LongComment != undefined && zp.LongComment != "") {
      measNotes.value = "[Zoller Comment] " + zp.LongComment;
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
        var ex = parent.querySelector("[data-measure='" + zp.MeasuringDeviceId + "']").parentElement;
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

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "MeasuringDeviceV2/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerStorage(id) {
	this.isNull = true;
	this.ZollerProperties = {
		StorageId:"",
		StorageName:"",
		Width:"",
		Height:"",
		Depth:"",
		ExternalSystemControl:"",
		Type:"",
		CirculationControl:"",
		IsStockOrderNeeded:"",
		DatasetState:"",
		StoragePlace:{
			StoragePlaceBaseId:"",
			Description:""
		}
	}
	this.CustomProperties = {};
	this.AdditionalData = {};
	
	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Storage: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Storage", "Storage.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(this.XML, props[n], "Storage.");
		}
		var sp = getNodeByTagName(node, "StoragePlace", "Storage.");
		if (sp !== undefined){
			zp["StoragePlace"].StoragePlaceBaseId = getValue(sp, "StoragePlaceBaseId", "Storage.");
			zp["StoragePlace"].Description = getValue(sp, "Description", "Storage.");
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Storage/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerDepartment(id){
	this.isNull = true;
	this.ZollerProperties = {
		DepartmentId:"",
		Description:"",
		Comment:"",
		DatasetState:"",
		LongComment:""
	}
	this.CustomProperties = {};
	this.AdditionalData = {};
	this.Employees = [];
	this.Machines = [];
	this.Fixtures = [];
	this.CostCenter;
	this.Image;
	this.Contact;
	
	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Department: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Department", "Department.");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n], "Department.");
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			// Get Components and Accessories of the Measuring Device
			if (node.children[n].tagName.indexOf("EmployeesList") >= 0) {
				cmpnts = getNodes(node.children[n], "Employees", "Department.");
				if (cmpnts != undefined) {
					for (var clen = cmpnts.length, i = 0; i < clen; i++) {
						var se = new ZollerSubEmployee();
						se.Position = i+1;
						se.Employee = new ZollerEmployee(cmpnts[i]);
						this.Employees.push(se);
					}
				} else {
					console.log("No employees found in EmployeesList");
				}
			}else if (node.children[n].tagName.indexOf("Contact") >= 0){
				this.Contact = new ZollerContact(node.children[n]);
			}else{
				if (zp[node.children[n].tagName.replace("Department.","")] == undefined){
					this.AdditionalData[node.children[n].tagName] = node.children[n].innerHTML;
				}
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Department/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
}

function ZollerDocument(id){
	this.isNull = false;
	this.DocumentId = "";
	this.CreationTime = "";
	this.LastModified = "";
	this.DocumentSize = "";
	this.DocumentMimeType = "";
	this.DocumentLocation = "";
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

function ZollerEmployee(id){
	this.isNull = true;
	this.ZollerProperties = {
		EmployeesId:"",
		LastName:"",
		FirstName:"",
		Title:"",
		EntryDate:"",
		Token:"",
		Function:"",
		DateOfBirth:"",
		DatasetState:"",
		LongComment:""
	}
	this.CustomProperties = {};
	this.Image;
	this.Contact;
	
	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Employee: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "Employees");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		var props = Object.getOwnPropertyNames(zp);
		for (var len = props.length, n = 0; n < len; n++){
			zp[props[n]] = getValue(node, props[n]);
		}
		// Iterate through each main node to find pertinent data for the current object. This is done to avoid getting data from SubData nodes
		for (var len = node.children.length, n = 0; n < len; n++) {
			if (node.children[n].tagName == "Contact"){
				this.Contact = new ZollerContact(node.children[n]);
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  if ((typeof id) == "string") {
    this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Employee/" + id + "?LoadSubData=true", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
  } else if ((typeof id) == "object") {
    this.SetXML(id);
  } else {
    console.log("Invalid object type!");
		this.isNull = true;
  }
	
	this.Initialize();
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
function ZollerSubEmployee(){
	this.Position = -1;
	this.Employee;
}
function ZollerContact(xml){
	this.XML = xml
	this.ZollerProperties = {
		Street:"",
		ZipCode:"",
		City:"",
		CityAppendix:"",
		Country:"",
		PostOfficeBox:"",
		PostOfficeZipCode:"",
		TelefonNr:"",
		Telefon2Nr:"",
		TelefonPrivate:"",
		TelefonMobil:"",
		FaxNr:"",
		FaxPrivate:"",
		Email:"",
		Homepage:""
	}
	var zp = this.ZollerProperties;
	var props = Object.getOwnPropertyNames(zp);
	for (var len = props.length, n = 0; n < len; n++){
		zp[props[n]] = getValue(this.XML, props[n]);
	}
}

function ZollerGraphicImage(file, group) {
  this.FileName = encodeURI(file);
  this.GraphicGroup = group;
	this.CreateImage = function(){
		var img = new Image(ZollerGlobal.Graphics.PreviewSize.Medium.width, ZollerGlobal.Graphics.PreviewSize.Medium.height);
		if (this.FileName && this.GraphicGroup && this.FileName !== "" && this.GraphicGroup !== "") {
			if (this.FileName.toLowerCase().endsWith(".dxf") || this.FileName.toLowerCase().endsWith(".stp")) {
				this.ImageURL = ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=800&h=600";
				img.src = ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + ZollerGlobal.Graphics.PreviewSize.Medium.width + "&h=" + ZollerGlobal.Graphics.PreviewSize.Medium.height;
			} else {
				this.ImageURL = ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName;
				img.src = this.ImageURL;
			}
		}
		img.setAttribute("class", "graphic");
		img.setAttribute("style", "object-fit: contain;");
		return img;
	}
  // this.Image = (function(){
		// if (this._Image === null){
			// this._Image = this.CreateImage();
		// }
		// return this._Image;
	// }).bind(this);//this.CreateImage();
	// this._Image = null;
  this.GetCustomImageURL = function (width, height) {
    if (this.GraphicGroup && this.FileName && this.GraphicGroup !== "" && this.FileName !== "") {
      return ZollerGlobal.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + width + "&h=" + height;
    } else {
      return ""
    }
  }
	
	return this;
}

function ZollerServiceInstance(){
	this.isNull = true;
	this.ZollerProperties = {
		WebServiceVersion:"",
		HostName:"",
		Port:"",
		WebInterfaceVersion:"",
		ZollerVersion:"",
		DocumentsPath:"",
		GraphicsPath:"",
		AuthorizationType:"",
		AuthorizationRequired:"",
		DatabaseType:"",
		DatabaseName:"",
		DatabaseVersion:""
	}
	
	this.CharacteristicStructureNames = [];

	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Service-Instance: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "service-instance");
		if (node == undefined){this.isNull = true;return undefined;}
		var si = getNodeByTagName(this.XML, "service-instance");
		this.IsTrueZoller = true;
		var zp = this.ZollerProperties;
		zp.WebServiceVersion = getAttribute(si, "version");
		zp.HostName = getAttribute(si, "machine");
		zp.Port = getAttribute(si, "port");
		var v = getNodeByTagName(this.XML, "version");
		zp.WebInterfaceVersion = getValue(v, "Interface");
		zp.ZollerVersion = getValue(v, "System");
		var p = getNodeByTagName(this.XML, "properties");
		zp.DocumentsPath = getValue(p, "DocumentRoot");
		zp.GraphicsPath = getValue(p, "GraphicRoot");
		zp.AuthorizationType = getValue(p, "AuthorizationType");
		zp.AuthorizationRequired = (getValue(p, "AuthorizationAllwaysRequired") == "true");
		var d = getNodeByTagName(this.XML, "database");
		zp.DatabaseType = getValue(d, "DbSystem");
		zp.DatabaseName = getValue(d, "Database");
		zp.DatabaseVersion = getValue(d, "DbVersion");
		var cs = getNodes(d, "CharacteristicStructure");
		for (var len = cs.length, n = 0; n < len; n++){
			this.CharacteristicStructureNames.push({"Name":cs[n].innerHTML,"Type":getAttribute(cs[n],"type"),"Version":getAttribute(cs[n],"version"),"XML":cs[n]});
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

  var nodeInstance;
	this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "service-instance/", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
	
	this.Initialize();
	
}
function ZollerDocumentList(){
	this.isNull = true;
	this.Documents = [];
	
	this.Initialize = function(){
		if (_Verbose){console.log("Initializing Document: ", this)}
		if (!this.isNull){return this}
		if (this.XML == undefined){this.isNull = true;return undefined} // Cannot initialize without xml
		var node = getNodeByTagName(this.XML, "BrowseResult");
		if (node == undefined){this.isNull = true;return undefined;}
		this.IsTrueZoller = true;
		var docs = getNodes(this.XML,"Document");
		if (docs != undefined){
			if (docs.length > 0){
				for (var len = docs.length, n = 0; n < len; n++){
					this.Documents.push(new ZollerDocument(docs[n]));
				}
			}
		}
		this.isNull = false;
		return this;
	}
	
  this.XML;
  this.SetXML = function (xml) {
		this.XML = xml;
		this.Initialize();
  }

	this.XML = ZollerGlobal.Request.FromProxy.call(this,"GET", "Document", this.SetXML, null, !(document.readyState === "complete")); // Only async when not

	this.Initialize();	
}
function ZollerArticleCharacteristicBarList(){
	this.isNull = false;
	
	this.ArticleCharacteristics = [];
	
	if (ZollerGlobal.DocumentList != undefined){
		if (ZollerGlobal.DocumentList.Documents.length > 0){
			for(var len = ZollerGlobal.DocumentList.Documents.length, n = 0; n < len; n++){
				var docu = ZollerGlobal.DocumentList.Documents[n];
				if (docu.DocumentId.indexOf("ArticleCharacteristicsBar")>=0 && docu.AddScript != undefined){
					docu.AddScript();// Adds Script tag to body
					var id = docu.DocumentId.substring(docu.DocumentId.indexOf("/")+1,docu.DocumentId.indexOf("."));
					var obj = getGlobalByName("_zac" + id);
					if (obj != undefined){
						this.ArticleCharacteristics.push((new ZollerArticleCharacteristicBar(obj)));
					}
				}
			}
		}
	}
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
		this.JSON = json;
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
		this.JSON = json;
  }
}
function ZollerArticleCharacteristic(json) {
  this.ID = "";
  this.Label = "";
  if (json != undefined) {
    if (json.id != undefined) { this.ID = json.id; }
    if (json.label != undefined) { this.Label = json.label; }
		this.JSON = json;
  }
}

function GetACCharacteristicLabelById(systemId, typeId, identifier) {
  if (identifier != undefined && systemId != undefined && typeId != undefined) {
    var c = GetACCharacteristicById(systemId, typeId, identifier);
    if (c != undefined) {
      return c.Label;
    }
  }
	//console.log("Couldn't find AC Characteristic Label from\n\tSystemId: " + systemId + "\n\tTypeId: " + typeId + "\n\tIdentifier: " + identifier);
	return "{Unknown}";
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
	//console.log("Couldn't find AC Characteristic from \n\tSystemId: " + systemId + "\n\tTypeId: " + typeId + "\n\tIdentifier: " + identifier);
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
	//console.log("Couldn't find AC Type from \n\tSystemId: " + systemId + "\n\tIdentifier: " + identifier);
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
	//console.log("Couldn't find AC System from \n\tIdentifier: " + identifier);
  return undefined;
}

function ZollerCustomArray(type, arr){
	this._ID = guid();
	this.Objects = new Array();
	this.Get = {
		ByZollerProperty: function(prop, val){
			for (var len = this.Objects.length, n = 0; n < len; n++){
				if (this.Objects[n].ZollerProperties[prop] === val){
					return this.Objects[n];
				}
			}
			return null;
		},
		ByCustomProperty: function(prop, val){
			for (var len = this.Objects.length, n = 0; n < len; n++){
				if (this.Objects[n].CustomProperties[prop] === val){
					return this.Objects[n];
				}
			}
			return null;
		}
	};
	this.Search = {
		Filter: {}
	};
	this.Draw = (function(parent, canEdit, focusObj){
		if (parent !== undefined){this._DrawParent = parent}
		this._DrawParent.innerHTML = "";
		ZollerGlobal.DrawArrayHTML(this.Objects, this, parent, canEdit, focusObj);
	}).bind(this);
	this.Callbacks = {
		Edited: function(obj, prop, val){}, // This only applies to Custom Properties. Provides object reference, custom property name, and new custom property value.
		Selected: function(obj){}
	};	
	ZollerGlobal.CustomArrays.push({id: this._ID,ref: this});
	if (arr !== undefined && ZollerType[type] !== undefined){
		for (var len = arr.length, n = 0; n < len; n++){
			if (typeof arr[n] === "string"){
				this.Objects.push(new ZollerObject(type, arr[n]));
			}else{
				this.Objects.push(arr[n]);
			}
		}
	}
	return this;
	// if (arr != undefined && window[type] != undefined){
	// 	for (var len = arr.length, n = 0; n < len; n++){
	// 		this.Objects.push(new window[type](arr[n]));
	// 	}
	// }
}
function ZollerPropertyTab_Clicked(e){
	for (var l = ZollerGlobal.CustomArrays.length, a = 0; a < l; a++){
		if (ZollerGlobal.CustomArrays[a].id == e.target.getAttribute("data-arguid")){
			ZollerGlobal.CustomArrays[a].ref["_CurrentTab"] = e.target.getAttribute("href");
			console.log("Property Clicked: ", e);
			break;
		}
	}
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
function getValue(xdoc, name, altPrefix) {
  var rtn = getNodeByTagName(xdoc, name, altPrefix);
  if (rtn != undefined) {
    return rtn.textContent;//innerHTML;
  } else {
    return undefined;
  }
}
function getNodes(xdoc, name, altPrefix) {
	if (xdoc != undefined){
		if (xdoc.getElementsByTagName != undefined){
			if (xdoc.getElementsByTagName(name).length > 0){
				return xdoc.getElementsByTagName(name);
			}else if (xdoc.getElementsByTagName(altPrefix + name).length > 0){
				return xdoc.getElementsByTagName(altPrefix + name);
			}
		}else{
			if (xdoc.querySelectorAll(name).length > 0){
				return xdoc.querySelectorAll(name);
			}else if (xdoc.querySelectorAll(altPrefix + name).length > 0){
				return xdoc.querySelectorAll(altPrefix + name);
			}
		}
	}else{
		if (_Verbose){console.log("[getNodes] xdoc was undefined!", xdoc)}
	}
	return []
}
function getNodeByInnerText(xdoc, name, search) {
  var arr = getNodes(xdoc, name);
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
function getNodeByTagName(xdoc, name, altPrefix) {
	if (altPrefix == undefined){ altPrefix = "" }
  if (xdoc != undefined) {
    if (xdoc.nodeName == name || xdoc.nodeName == (altPrefix + name)) {
      return xdoc;
    }
  }else{
		return undefined
	}
	if (xdoc.childNodes != undefined && xdoc.childNodes.length >= 0){
		for (var len = xdoc.childNodes.length, n = 0; n < len; n++) {
			if (xdoc.childNodes[n].nodeName == name || xdoc.childNodes[n].nodeName == (altPrefix + name)) {
				return xdoc.childNodes[n];
			} else if (xdoc.childNodes[n].childNodes.length > 0) {
				var tempVal = getNodeByTagName(xdoc.childNodes[n], name, altPrefix);
				if (tempVal != undefined) { return tempVal; }
			}
		}
	}
  return undefined;
}
function getNodesByXPath(xdoc, xpath){
	if (xdoc.ownerDocument != undefined){xdoc = xdoc.ownerDocument}
	var iterator = xdoc.evaluate(xpath, xdoc.documentElement, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
	var nds = new Array();
	try{
		var n = iterator.iterateNext();
		while (n){
			nds.push(n);
			n = iterator.iterateNext();
		}
	}catch(e){
		console.log("Error: ", e);
	}
	return nds;
}

function setValue(xdoc, name, val, altPrefix){
  var rtn = getNodeByTagName(xdoc, name, altPrefix);
  if (rtn != undefined) {
    rtn.textContent = val;
		return true
  }
	return false;
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
	RequestBaseURL: window.location.origin + "/UpdateSetupSheet.asmx/SetZoller",
	WebServiceBaseURL: "http://server:8084/ZollerDbService/",
	ServiceInstance: null,
	DocumentList: null,
	ArticleCharacteristicBars: null,
	UserName: "zoller",
	UserPassword: "zoller",
	Request: {
		CreateAuthorization: function(method, query){
			this.Method = method;
			this.Date = (new Date()).getRFC2616();
			this.User64 = function(){
				return btoa(ZollerGlobal.UserName);
			}
			this.Request = query;
			this.StringToSign = function(){
				return this.Method + "\n" + this.Date + "\n" + "/ZollerDbService/" + this.Request;
			}
			this.Signiture = function(){
				return b64_hmac_sha1(ZollerGlobal.UserPassword, this.StringToSign());
			}
			this.Authorization = function(){
				return "ZWS " + this.User64() + ":" + this.Signiture();
			}
			this.ToString = function(){
				return this.Authorization();
			}
			return this;
		},
		FromProxy: function(method, query, callback, data, async){
			var self = this;
			var xhr = new XMLHttpRequest();
			if (async == undefined) { async = false; }
			xhr.open("POST", ZollerGlobal.RequestBaseURL, async);

			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			if (_Verbose && data !== null && (typeof data) !== "undefined"){console.log("Content Length: ", data.length)}
			xhr.onprogress = function (e) {
				if (_Verbose){
					var done = e.position || e.loaded, total = e.totalSize || e.total;
					console.log("[ZollerGlobal.Request.FromProxy] XHR Progress: " + (Math.floor(done / total * 1000) / 10) + '%');
				}
			}
			if (xhr.upload && _Verbose) {
				xhr.upload.onprogress = function (e) {
					var done = e.position || e.loaded, total = e.totalSize || e.total;
					console.log("[ZollerGlobal.Request.FromProxy] XHR Upload Progress: " + (Math.floor(done / total * 1000) / 10) + '%');
				}
			}
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {// && xhr.status == 200){
					if (xhr.status === 200) {
						if (callback !== undefined && callback !== null) {
							// New Code
							if (xhr.responseXML && xhr.responseXML !== null){
								if (xhr.responseXML.firstChild !== null && xhr.responseXML.firstChild.hasAttribute !== null) {
									if (xhr.responseXML.firstChild.hasAttribute("result")) {
										if (xhr.responseXML.firstChild.getAttribute("result") === "fail") {
											console.log("[ZollerGlobal.Request.FromProxy] Invalid response from TMS!");
											callback.call(self, null);
											return null;
										}
									}
								}
								callback.call(self, xhr.responseXML);
								return xhr.responseXML;
							}
						}
					}
				}
			}
			if (data === null) {
				xhr.send("url=" + encodeURIComponent(ZollerGlobal.WebServiceBaseURL + query) + "&method=" + method + "&data=");
			} else {
				xhr.send("url=" + encodeURIComponent(ZollerGlobal.WebServiceBaseURL + query) + "&method=" + method + "&data=" + encodeURIComponent(data));
			}
			if (xhr.responseXML && xhr.responseXML !== null){
				return xhr.responseXML;
			}else{
				return null;
			}
		},
		FromService: function(method, query, callback,data, async){
			console.log("[ZollerGlobal.Request.FromService] This is an experimental function and requires that the TMS Web Service allows CORS!");
			var xhr = new XMLHttpRequest();
			
			if (xhr.withCredentials !== undefined){
				xhr.open(method, ZollerGlobal.WebServiceBaseURL + query, async);
			} else if (typeof XDomainRequest != "undefined"){
				xhr = new XDomainRequest();
				xhr.open(method, ZollerGlobal.WebServiceBaseURL + query);
			} else{
				xhr = null;
			}
			
			if (async == undefined) { async = false; }
			xhr.open(method, ZollerGlobal.WebServiceBaseURL + query, async);
			xhr.withCredentials = true;
			xhr.setRequestHeader("Content-Type", "application/xml");
			var auth = ZollerGlobal.Request.CreateAuthorization(method, query);
			xhr.setRequestHeader("Authorization", auth.ToString());
			xhr.setRequestHeader("x-zws-date", auth.Date);
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
			xhr.send(data);

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
					ZollerGlobal.Raise.Tool.Selected(el.dataset.tool, el);
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
					if (this.lastElement == undefined) {
						this.lastElement = this;
						this.lastElement.classList.add("over");
					} else {
						this.lastElement.classList.remove("over");
						this.lastElement = this;
						this.lastElement.classList.add("over");
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
	},
	CustomArrays: [],
	DrawArrayHTML: function(arr, ref, parent, canEdit, focusObj, topLevel){
		if (topLevel == undefined){topLevel = true}
		var pnlMain = document.createElement("div");
		pnlMain.setAttribute("class","row");
		pnlMain.setAttribute("data-arguid", ref["_ID"]);
		var pnlList = document.createElement("div");
		var pnlDetails = document.createElement("div");
		if (topLevel){
			pnlList.setAttribute("class","col-lg-6 col-md-6 col-sm-6 col-xs-6");
			pnlDetails.setAttribute("class", "col-lg-6 col-md-6 col-sm-6 col-xs-6");
			pnlList.setAttribute("style", "position: relative; display: block; overflow: auto; height: 500px;");
			pnlDetails.setAttribute("style", "position: relative; display: block; overflow: auto; height: 500px;");
			pnlList.setAttribute("id", "pnlZIDList");
		}else{
			pnlList.setAttribute("style", "position: relative; display: block;");
			pnlDetails.setAttribute("style", "position: relative; display: block;");
		}
		if (topLevel && canEdit && focusObj != undefined){
			var btnRemove = document.createElement("button");
			btnRemove.setAttribute("class", "btn btn-md btn-warning");
			btnRemove.setAttribute("type", "button");
			btnRemove.style.position = "absolute";
			btnRemove.style.right = "0";
			btnRemove.style.bottom = "-15px";
			btnRemove.innerText = "Remove";
			btnRemove.setAttribute("data-arguid", ref["_ID"]);
			btnRemove.setAttribute("data-objguid", focusObj);
			btnRemove.addEventListener("click", function(e){
				var arr = ZollerGlobal.Get.CustomArray.ByArGUID(e.target.getAttribute("data-arguid"));
				console.log("ArGUID: ", e.target.getAttribute("data-arguid"));
				console.log("ObjGUID: ", e.target.getAttribute("data-objguid"));
				console.log("Main Array: ", arr.Objects);
				if (arr != null){
					console.log("Object: ", ZollerGlobal.Get.CustomArray.ObjectByGUID(arr.Objects, e.target.getAttribute("data-objguid")));
				}
				
			}, true);
			pnlMain.appendChild(btnRemove);
		}
		var ulTab = document.createElement("ul");
		ulTab.setAttribute("class", "nav nav-tabs");
		var tabContainer = document.createElement("div");
		tabContainer.setAttribute("class", "row tab-content");
		// Property Panels:
		// Custom Properties
		var pnlTab = document.createElement("li");
		var pnlTabA = document.createElement("a");
		pnlTabA.setAttribute("data-toggle", "tab");
		pnlTabA.setAttribute("href", "#pnlZMCP");
		pnlTabA.setAttribute("data-arguid", ref["_ID"]);
		pnlTabA.addEventListener("click", ZollerPropertyTab_Clicked,true);
		pnlTabA.innerText = "Custom Properties";
		pnlTab.appendChild(pnlTabA);
		ulTab.appendChild(pnlTab);
		
		var pnlPanel = document.createElement("div");
		pnlPanel.setAttribute("id", "pnlZMCP")
		if (topLevel){
			this.pnlZMCPTable = document.createElement("table");
			this.pnlZMCPTable.setAttribute("class", "table table-striped table-hover table-condensed table-responsive");
			this.pnlZMCPTable.innerHTML = "<thead><tr><th>Name</th><th>Value</th></tr></thead><tbody></tbody>";
			pnlPanel.appendChild(this.pnlZMCPTable);
		}
		if (ref["_CurrentTab"] === undefined || ref["_CurrentTab"] == "#pnlZMCP"){
			pnlTab.setAttribute("class", "active");
			pnlPanel.setAttribute("class", "tab-pane fade in active");
		}else{
			pnlPanel.setAttribute("class", "tab-pane fade");
		}
		tabContainer.appendChild(pnlPanel);
		
		// Zoller Properties
		pnlTab = document.createElement("li");
		pnlTabA = document.createElement("a");
		pnlTabA.setAttribute("data-toggle", "tab");
		pnlTabA.setAttribute("href", "#pnlZMZP");
		pnlTabA.setAttribute("data-arguid", ref["_ID"]);
		pnlTabA.addEventListener("click", ZollerPropertyTab_Clicked,true);
		pnlTabA.innerText = "Zoller Properties";
		pnlTab.appendChild(pnlTabA);
		ulTab.appendChild(pnlTab);
		pnlPanel = document.createElement("div");
		pnlPanel.setAttribute("id", "pnlZMZP");
		if (topLevel){
			this.pnlZMZPTable = document.createElement("table");
			this.pnlZMZPTable.setAttribute("class", "table table-striped table-hover table-condensed table-responsive");
			this.pnlZMZPTable.innerHTML = "<thead><tr><th>Name</th><th>Value</th></tr></thead><tbody></tbody>";
			pnlPanel.appendChild(this.pnlZMZPTable);
		}
		if (ref["_CurrentTab"] == "#pnlZMZP"){
			pnlTab.setAttribute("class", "active");
			pnlPanel.setAttribute("class", "tab-pane fade in active");
		}else{
			pnlPanel.setAttribute("class", "tab-pane fade");
		}
		tabContainer.appendChild(pnlPanel);
		
		// Images
		pnlTab = document.createElement("li");
		pnlTabA = document.createElement("a");
		pnlTabA.setAttribute("data-toggle", "tab");
		pnlTabA.setAttribute("href", "#pnlZMIP");
		pnlTabA.setAttribute("data-arguid", ref["_ID"]);
		pnlTabA.addEventListener("click", ZollerPropertyTab_Clicked,true);
		pnlTabA.innerText = "Images";
		pnlTab.appendChild(pnlTabA);
		ulTab.appendChild(pnlTab);
		pnlPanel = document.createElement("div");
		pnlPanel.setAttribute("id", "pnlZMIP");
		if (topLevel){
			this.pnlImages = document.createElement("div");
			this.pnlImages.setAttribute("style", "position: relative; display: block; width: 100%; height: auto; overflow: auto;");
			pnlPanel.appendChild(this.pnlImages);
		}
		if (ref["_CurrentTab"] == "#pnlZMIP"){
			pnlTab.setAttribute("class", "active");
			pnlPanel.setAttribute("class", "tab-pane fade in active");
		}else{
			pnlPanel.setAttribute("class", "tab-pane fade");
		}
		tabContainer.appendChild(pnlPanel);
		
		// Add to Details Panel:
		pnlDetails.appendChild(ulTab);
		pnlDetails.appendChild(tabContainer);
		
		// Begin processing List
		var divListItems = new Array();
		for (var len = arr.length, n = 0; n < len; n++){
			var oid;
			if (arr[n]["_ID"] == undefined){
				 oid = guid();
			}else{
				oid = arr[n]["_ID"];
			}
			arr[n]["_ID"] = oid;
			divListItems.push(document.createElement("div"));
			divListItems[n].setAttribute("data-id", oid);
			divListItems[n].setAttribute("data-arguid", ref["_ID"]);
			if (focusObj !== undefined){
				if (focusObj === oid){
					if (_Verbose){console.log("Found focus object!: ", arr[n])}
					divListItems[n].setAttribute("style", "position: relative;display: block;height: auto;background-color: lightgreen;border: 1px solid black;margin-left: 25px;");
					
					// Add Custom Properties
					var prp = Object.getOwnPropertyNames(arr[n].CustomProperties);
					if (prp.length > 0){
						var tbod = document.createElement("tbody");
						var trp;
						for (var clen = prp.length, i = 0; i < clen; i++){
							if (arr[n].CustomProperties[prp[i]] != undefined && arr[n].CustomProperties[prp[i]] !== ""){
								trp = document.createElement("tr");
								trp.innerHTML = "<td>" + prp[i] + "</td><td>" + arr[n].CustomProperties[prp[i]] + "</td>";
								tbod.appendChild(trp);
							}
						}
						this.pnlZMCPTable.appendChild(tbod);
					}else{
						console.log("No Custom Properties available: ", arr[n].CustomProperties);
					}
					
					// Add Characteristic Structures
					tbod = document.createElement("tbody");
					if (arr[n]["CharacteristicStructures"] != undefined){
						for (var cslen = arr[n]["CharacteristicStructures"].length, cs = 0; cs < cslen; cs++){
							if (arr[n]["CharacteristicStructures"][cs]["Characteristics"] != undefined){
								for (var csclen = arr[n]["CharacteristicStructures"][cs]["Characteristics"].length, csc = 0; csc < csclen; csc++){
									var trp = document.createElement("tr");
									var td = document.createElement("td");
									td.setAttribute("title", "Article Characteristic System: " + arr[n]["CharacteristicStructures"][cs].System);
									if (arr[n]["CharacteristicStructures"][cs]["Characteristics"][csc].Label != undefined){
										td.innerHTML = "<b>" + arr[n]["CharacteristicStructures"][cs]["Characteristics"][csc].Label + "</b>";
									}else{
										td.innerHTML = "{" + arr[n]["CharacteristicStructures"][cs]["Characteristics"][csc].Id + "}";
									}
									trp.appendChild(td);
									td = document.createElement("td");
									td.setAttribute("title", "Article Characteristic System: " + arr[n]["CharacteristicStructures"][cs].System);
									td.setAttribute("data-cs", arr[n]["CharacteristicStructures"][cs].System);
									td.setAttribute("data-csc", arr[n]["CharacteristicStructures"][cs]["Characteristics"][csc].Id);
									td.innerHTML = arr[n]["CharacteristicStructures"][cs]["Characteristics"][csc].Value;
									trp.appendChild(td);
									tbod.appendChild(trp);
								}
							}
						}
					}
					
					// Add Zoller Properties
					prp = Object.getOwnPropertyNames(arr[n].ZollerProperties);
					if (prp.length > 0){
						for (var clen = prp.length, i = 0; i < clen; i++){
							if (arr[n].ZollerProperties[prp[i]] != undefined && arr[n].ZollerProperties[prp[i]] !== ""){
								var trp = document.createElement("tr");
								trp.innerHTML = "<td>" + prp[i] + "</td><td>" + arr[n].ZollerProperties[prp[i]] + "</td>";
								tbod.appendChild(trp);
							}
						}
					}else{
						console.log("No Zoller Properties available: ", arr[n].ZollerProperties);
					}
					this.pnlZMZPTable.appendChild(tbod);
					
					// Add Image(s)
					if (arr[n]["Images"] != undefined){
						for (var il = arr[n]["Images"].length, i = 0; i < il; i++){
							var imgA = document.createElement("a");
							imgA.setAttribute("target", "_blank");
							imgA.setAttribute("href", arr[n]["Images"][i].GetCustomImageURL(600, 400));
							imgA.appendChild(arr[n]["Images"][i].CreateImage()).setAttribute("style", "object-fit: contain;");
							this.pnlImages.appendChild(imgA);
						}
					}else if (arr[n]["Image"] != undefined){
						this.pnlImages.appendChild(arr[n]["Image"].CreateImage());
					}
					this.focusObj = divListItems[n];
				}else{
					divListItems[n].setAttribute("style", "position: relative;display: block;height: auto;margin-left: 35px");
				}
			}else{
				divListItems[n].setAttribute("style", "position: relative;display: block;height: auto;margin-left: 35px;");
			}
			divListItems[n].addEventListener("click", (function(e){
				for (var l = ZollerGlobal.CustomArrays.length, a = 0; a < l; a++){
					if (ZollerGlobal.CustomArrays[a].id == e.target.getAttribute("data-arguid")){
						ZollerGlobal.CustomArrays[a].ref.Draw(ZollerGlobal.CustomArrays[a].ref["_DrawParent"], canEdit, e.target.getAttribute("data-id"));
						console.log("Clicked!", e.target.getAttribute("data-id"));
						break;
					}
				}
			}).bind(ref),true);
			// Create/Add Image to ListItem
			var imgListItem = document.createElement("img");
			if (arr[n]["Images"] !== undefined && arr[n]["Images"].length > 0){
				imgListItem = arr[n]["Images"][0].Image;
			}else if (arr[n]["Image"] !== undefined){
				imgListItem = arr[n]["Image"].Image;
			}
			imgListItem.setAttribute("style", "width: 50px;height: 50px; border: 1px solid black;position: relative; display: inline-block;");
			imgListItem.setAttribute("data-id", oid);
			imgListItem.setAttribute("data-arguid", ref["_ID"]);
			divListItems[n].appendChild(imgListItem);
			
			// Create/Add Description to ListItem
			var divDescr = document.createElement("div");
			divDescr.setAttribute("style", "position: relative;display: inline-block;width: calc(100% - 50px);padding: 5px;");
			divDescr.setAttribute("data-id", oid);
			divDescr.setAttribute("data-arguid", ref["_ID"]);
			if (arr[n].ZollerProperties[arr[n].Type.Name + "Id"]){
				divDescr.innerHTML = "<sup>(" + arr[n].ZollerProperties[arr[n].Type.Name + "Id"] + ")</sup> ";
			}
			if (arr[n].ZollerProperties["Description"] !== undefined){
				divDescr.innerText += arr[n].ZollerProperties["Description"];
			}else if (arr[n].ZollerProperties["Name"] !== undefined){
				divDescr.innerText += arr[n].ZollerProperties["Name"];
			}
			divListItems[n].appendChild(divDescr);
			
			// Search for "Child" objects
			if (arr[n].Type != undefined){
				for (var enlen = arr[n].Type.EnumerableTypes.length, en = 0; en < enlen; en++){
					if (arr[n][arr[n].Type.EnumerableTypes[en].Name + "List"] != undefined){
						ZollerGlobal.DrawArrayHTML(arr[n][arr[n].Type.EnumerableTypes[en].Name + "List"], ref, divListItems[n], canEdit, focusObj, false);
					}else{
						if (_Verbose){console.log("Enumerable type '" + arr[n].Type.EnumerableTypes[en].Name + "List' was not found: ", arr[n].Type)}
					}
				}
				for (var enlen = arr[n].Type.SubTypes.length, en = 0; en < enlen; en++){
					if (arr[n][arr[n].Type.SubTypes[en]] != undefined){
						ZollerGlobal.DrawArrayHTML([arr[n][arr[n].Type.SubTypes[en]]], ref, divListItems[n], canEdit, focusObj, false);
					}else{
						if (_Verbose){console.log("Sub type '" + arr[n].Type.SubTypes[en] + "' was not found: ", arr[n].Type)}
					}
				}
			}else{
				if (_Verbose){console.log("Type not available for object: ", arr[n])}
			}
			//var arrChildObjects = ["ToolList", "SingleComponents", "Fixtures", "Accessories", "MeasuringDevices"];
			// for (var clen = arrChildObjects.length, c = 0; c < clen; c++){
			// 	if (arr[n][arrChildObjects[c]] != undefined){
			// 		ZollerGlobal.DrawArrayHTML(arr[n][arrChildObjects[c]], ref, divListItems[n], canEdit, focusObj, false);
			// 	}
			// }
			
			pnlList.appendChild(divListItems[n]);
		}
		pnlMain.appendChild(pnlList);
		if (topLevel){
			pnlMain.appendChild(pnlDetails);
		}
		
		if (typeof parent !== "undefined" && parent !== undefined) {
			if (topLevel && (parent !== undefined || parent != false)) {
				var ex = parent.querySelector("[data-arguid='" + ref["_ID"] + "']");
				if (ex !== undefined && ex !== null) {
					if (ex.parentElement != undefined){
						parent.insertBefore(pnlMain, ex);
						parent.removeChild(ex);
					}else{
						parent.appendChild(pnlMain);
					}
				} else {
					parent.appendChild(pnlMain);
				}
			} else {
				parent.appendChild(pnlMain);
			}
		}
		if (topLevel && this.focusObj != undefined){
			var scrl = 0;
			if (FindParentWithAttribute(this.focusObj, "id", "pnlZIDList", function(s, e){
				if (s.getBoundingClientRect().top !== e.getBoundingClientRect().top){
					scrl += s.offsetTop;
				}
			}) != null){
				pnlList.scrollTop = scrl;
			}
		}
	},
	Get: {
		CustomArray: {
			ByArGUID: function(arguid){
				for (var len = ZollerGlobal.CustomArrays.length, n = 0; n < len; n++){
					if (ZollerGlobal.CustomArrays[n].id == arguid){
						return ZollerGlobal.CustomArrays[n].ref;
					}
				}
				return null;
			},
			ObjectByGUID: function(objArr, objGUID){
				var rtn = null;
				for (var len = objArr.length, n = 0; n < len; n++){
					var objSubTypes = new Array();
					for (var stlen = objArr[n].Type.SubTypes.length, st = 0; st < stlen; st++){
						objSubTypes.push(objArr[n].Type.SubTypes[st]);
					}
					for (var stlen = objArr[n].Type.EnumerableTypes.length, st = 0; st < stlen; st++){
						objSubTypes.push(objArr[n].Type.EnumerableTypes[st].Name + "List");
					}
					if (objArr[n]["_ID"] != undefined){
						if (objArr[n]["_ID"] == objGUID){
							rtn = objArr[n];
							break;
						}
					}
					for (var clen = objSubTypes.length, m = 0; m < clen; m++){
						if (objArr[n][objSubTypes[m]] != undefined){
							console.log("\tFound sub type: ", objSubTypes[m]);
							if (objArr[n][objSubTypes].length != undefined){
								rtn = ZollerGlobal.Get.CustomArray.ObjectByGUID(objArr[n][objSubTypes[m]], objGUID);
							}else{
								rtn = ZollerGlobal.Get.CustomArray.ObjectByGUID([objArr[n][objSubTypes[m]]], objGUID);
							}
							if (rtn != null){
								break;
							}else{
								console.log("\t\t Returned null");
							}
						}else{
							//console.log("Couldn't find " + objSubTypes[m] + " in: ", objArr[n]);
						}
					}
					if (rtn != null){
						break;
					}
				}
				return rtn;
			}
		}
	}
}


ZollerQuery = {
	GetSettingString: function(moduleType, pref){
		var out = "";
		if (pref != undefined){out = pref}
		var sp = Object.getOwnPropertyNames(ZollerType[moduleType].Settings);
		for (var len = sp.length, n = 0; n < len; n++){
			out += sp[n].toString() + "=" + ZollerType[moduleType].Settings[sp[n]].toString();
			if (n < (len - 1)){out += "&"}
		}
		return out;
	},
	Query: function(moduleType, strExpression, method){
		if (ZollerType[moduleType] != undefined){
			var strQuery = ZollerType[moduleType].Name + ZollerQuery.GetSettingString(ZollerType[moduleType].Name, "?");
			if (method != undefined){
				strQuery = strQuery + "&method=" + method;
			}
			if (strExpression !== "" && strExpression !== undefined){
				strExpression = strExpression.replace(/%/g, "&37;");
				strQuery = strQuery + "&expression=" + strExpression;
			}
			var objs = [];
			ZollerGlobal.Request.FromProxy("GET", strQuery, function(xml){
				if (xml != undefined){
					console.log("Response XML was fine", xml);
					var xobjs = getNodes(xml, ZollerType[moduleType].Name);
					for (var len = xobjs.length, n = 0; n < len; n++){
						objs.push(new ZollerObject(ZollerType[moduleType].Name, xobjs[n]));
					}
				}else{
					console.log("Response XML was undefined from '" + strExpression + "': ", xml);
				}
				return objs;
			});
			return objs;
		}else{
			console.log("'" + moduleType + "' does not exist as a ZollerType");
		}
	},
	Usage: function(moduleType, id){
		if (ZollerType[moduleType] !== undefined){
			var strQuery = ZollerType[moduleType].Name + "/" + id + "?method=usage";
			var objs = new Array();
			ZollerGlobal.Request.FromProxy("GET", strQuery, function(xml){
				if (xml !== undefined){
					var xobjs = getNodes(xml, "Item");
					for(var len = xobjs.length, n = 0; n < len; n++){
						var itm = xobjs[n];
						for(var zlen = itm.childNodes.length, z = 0; z < zlen; z++){
							objs.push(new ZollerObject(itm.childNodes[z].tagName, itm.childNodes[z].querySelector("Id").textContent));
						}
					}
				}
				return objs;
			},null , false);
			return objs;
		}
		return null;
	}
}


_ZollerACs = [];
// __tdm is a custom JSON object that represents a custom Article Characteristic Bar. The JSON helps define the appropriate labels for each identifier.
if (typeof __tdm !== "undefined") {
  _ZollerACs.push(new ZollerArticleCharacteristicBar(__tdm));
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
function guid(){
	function s4(){
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4() + s4();
}
function FindParentWithAttribute(obj, attr, val, callbackIndexer){
	if (obj.parentElement != undefined){
		if (callbackIndexer != undefined){
			callbackIndexer(obj, obj.parentElement);
		}
		if (obj.parentElement.getAttribute(attr) != undefined && obj.parentElement.getAttribute(attr) == val){
			return obj.parentElement;
		}else{
			return FindParentWithAttribute(obj.parentElement, attr, val, callbackIndexer);
		}
	}
	return null
}
Array.prototype.move = function(from, to){
	this.splice(to, 0, this.splice(from, 1)[0]);
};
function getGlobalByName(name){
	return (function(n){return this[n]}).call(null,name);
}
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