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

function ZollerObject(type, id){
	if ((typeof ZollerType[type]) !== "undefined"){
		this.Type = ZollerType[type];
	}else{
		if (_Verbose){console.log("Couldn't define Object type from '" + type + "'");}
	}
	// Object Properties
	this.isNull = true;
	this.ZollerProperties = {};
	this.CustomProperties = {};
	this.AdditionalData = {};
	this.Images = [];

	// Setup ZollerProperties regardless of validity in Zoller to ensure properties are available
	if ((typeof this.Type) !== "undefined"){
		this.Type.Properties.forEach(prop => {
			this.ZollerProperties[prop.Name] = null;
		});
		this.GlobalReference = this.Type.Name;
	}
	
	this.Initialize = (function(){
		if ((typeof this.Type) === "undefined"){return this;}
		if (_Verbose){console.log("Initializing " + this.Type.Name + ": ", this)}
		
		if ((typeof this.XML) !== "undefined"){
			var node = getNodeByTagName(this.XML, this.Type.Name, this.Type.Name + ".");
			if ((typeof node) !== "undefined"){
				// Iterate through all nodes, so you can capture AdditionalData fields
				for (var len = node.childNodes.length, n = 0; n < len; n++){
					if (node.childNodes[n].nodeName != "#text"){
						if (node.childNodes[n].nodeName.indexOf("GraphicFile") >= 0){
							this.Images.push(new ZollerGraphicImage(node.childNodes[n].textContent, getValue(node, node.childNodes[n].nodeName.replace("File", "Group"))));
						}else if(node.childNodes[n].nodeName.indexOf("GraphicGroup") >= 0){
							// Skip Graphic Group as it's handled in previous logic
						}else if (ContainsProperty(this.Type, node.childNodes[n].nodeName)){
							this.ZollerProperties[node.childNodes[n].nodeName] = node.childNodes[n].textContent;
						}else if(this.Type.SubTypes.indexOf(node.childNodes[n].nodeName) >= 0){
							this[node.childNodes[n].nodeName] = new ZollerObject(node.childNodes[n].nodeName, node.childNodes[n]);
							this[node.childNodes[n].nodeName]["GlobalReference"] = this.GlobalReference + "['" + this[node.childNodes[n].nodeName].Type.Name + "']";
						}else if(ContainsEnum(this.Type, node.childNodes[n].nodeName)){
							var enm = GetEnum(this.Type, node.childNodes[n].nodeName);
							var enmn = getNodes(node.childNodes[n], ZollerType[enm.Name].Name + "InList"); // Get all object nodes
							if (enmn.length > 0){
								this[enm.Name + "List"] = new Array();
								for (var enlen = enmn.length, en = 0; en < enlen; en++){
									// Iterate through Node Object references
									var nwEnumObj = new ZollerObject(enm.Name, enmn[en]);
									nwEnumObj["GlobalReference"] = this.GlobalReference + "['" + nwEnumObj.Type.Name + "List'][" + en + "]";
									for (var enplen = enm.Properties.length, enp = 0; enp < enplen; enp++){
										nwEnumObj.ZollerProperties[enm.Properties[enp].Name] = getValue(enmn[en], enm.Properties[enp].Name);
									}
									this[enm.Name + "List"].push(nwEnumObj);
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
		this.Type.SubTypes.forEach(subType => {
			if ((typeof this[subType]) === "undefined"){
				this[subType] = new ZollerObject(subType, "");// Create empty Reference
			}
		});
		this.Type.EnumerableTypes.forEach(enmType => {
			if ((typeof this[enmType.Name + "List"]) === "undefined"){
				this[enmType.Name + "List"] = new Array();
			}
		});
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
		Zoller.Preferences.Request.FromProxy("PUT", this.Type.Name + "/" + this.ZollerProperties[this.Type.Name + "Id"], function(xml){
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
		Zoller.Preferences.Request.FromProxy("POST", this.Type.Name, function(xml){
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
				console.log("No nodes returned");
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
					console.log("Trying to add Enumerable Property[" + propName + "]: ", enm.Properties[n]);
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
				console.log("Enumerable Property Nodes: ", nProps);
				// Add new object's XML structure
				var objNod = getNodeByTagName(obj.XML, obj.Type.Name);
				inlstNod.appendChild(objNod);
				lstNod.appendChild(inlstNod);
				return lstNod;
			}else{
				console.log("Could not find EnumerableType for '" + obj.Type.Name + "' in: ", this.Type);
			}
		}else{
			console.log("Object is either undefined or it's type is undefined");
		}
		return undefined;
	}).bind(this);
	
  this.XML = undefined;
  this.SetXML = (function (xml) {
		if (_Verbose){console.log("Setting XML: ",this)}
		this.XML = xml;
		return this.Initialize();
  }).bind(this);

  if ((typeof id) === "string" && (typeof this.Type) !== "undefined") {
    this.XML = Zoller.Preferences.Request.FromProxy.call(this,"GET", this.Type.Name + "/" + id + "?LoadSubData=true&ExportEmptyFields=true", this.SetXML); // Must specify context for Initialization to work after SetXML
  } else if ((typeof id) == "object") {
    return this.SetXML(id);
  } else {
    console.log("Invalid object type!");
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
		Properties: [
			new ZollerProperty("Street"),
			new ZollerProperty("ZipCode"),
			new ZollerProperty("City"),
			new ZollerProperty("CityAppendix"),
			new ZollerProperty("Country"),
			new ZollerProperty("TelefonNr"),
			new ZollerProperty("Telefon2Nr"),
			new ZollerProperty("TelefonPrivate"),
			new ZollerProperty("TelefonMobil"),
			new ZollerProperty("FaxNr"),
			new ZollerProperty("FaxPrivate"),
			new ZollerProperty("Email"),
			new ZollerProperty("Homepage"),
			new ZollerProperty("FirstName"),
			new ZollerProperty("LastName"),
			new ZollerProperty("PostOfficeBoxZipCode"),
			new ZollerProperty("PostOfficeBox"),
			new ZollerProperty("Title"),
			new ZollerProperty("Name"),
			new ZollerProperty("DeliveryStreet"),
			new ZollerProperty("DeliveryZipCode"),
			new ZollerProperty("DeliveryCity"),
			new ZollerProperty("DeliveryCityAppendix"),
			new ZollerProperty("DeliveryCountry"),
			new ZollerProperty("DeliveryPostOfficeBoxZipCode"),
			new ZollerProperty("DeliveryPostOfficeBox"),
			new ZollerProperty("DeliveryName"),
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


function ZollerGraphicImage(file, group) {
  this.FileName = encodeURI(file);
  this.GraphicGroup = group;
	this.CreateImage = function(){
		var img = new Image(Zoller.Preferences.Graphics.PreviewSize.Medium.width, Zoller.Preferences.Graphics.PreviewSize.Medium.height);
		if (this.FileName && this.GraphicGroup && this.FileName !== "" && this.GraphicGroup !== "") {
			if (this.FileName.toLowerCase().endsWith(".dxf") || this.FileName.toLowerCase().endsWith(".stp")) {
				this.ImageURL = Zoller.Preferences.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=800&h=600";
				img.src = Zoller.Preferences.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + Zoller.Preferences.Graphics.PreviewSize.Medium.width + "&h=" + Zoller.Preferences.Graphics.PreviewSize.Medium.height;
			} else {
				this.ImageURL = Zoller.Preferences.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName;
				img.src = this.ImageURL;
			}
		}
		img.setAttribute("class", "graphic");
		img.setAttribute("style", "object-fit: contain;");
		return img;
	}
  this.Image = this.CreateImage();
  this.GetCustomImageURL = function (width, height) {
    if (this.GraphicGroup && this.FileName && this.GraphicGroup !== "" && this.FileName !== "") {
      return Zoller.Preferences.WebServiceBaseURL + "Graphic/" + this.GraphicGroup + "/" + this.FileName + "?w=" + width + "&h=" + height;
    } else {
      return ""
    }

  }
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
	this.XML = Zoller.Preferences.Request.FromProxy.call(this,"GET", "service-instance/", this.SetXML, null, !(document.readyState === "complete")); // Only async when not
	
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

	this.XML = Zoller.Preferences.Request.FromProxy.call(this,"GET", "Document", this.SetXML, null, !(document.readyState === "complete")); // Only async when not

	this.Initialize();	
}
function ZollerArticleCharacteristicBarList(){
	this.isNull = false;
	
	this.ArticleCharacteristics = [];
	
	if (Zoller.Preferences.DocumentList != undefined){
		if (Zoller.Preferences.DocumentList.Documents.length > 0){
			for(var len = Zoller.Preferences.DocumentList.Documents.length, n = 0; n < len; n++){
				var docu = Zoller.Preferences.DocumentList.Documents[n];
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


$.fn.zollertool = function(tool){
	if (!tool && this.attr("data-id") != ""){
		tool = new ZollerObject("Tool", this.attr("data-id"));
	}
	this.html("");// Clear HTML
	var tlImageUrl = "";
	if ((typeof tool.Images[0]) !== "undefined"){
		tlImageUrl = tool.Images[0].GetCustomImageURL();
	}
	this.append("<p><a href=\"" + tlImageUrl + "\" target=\"_blank\"><image width=\"50\" height=\"50\" style=\"object-fit: contain;\" src=\"" + tlImageUrl + "\" /></a>(" + tool.ZollerProperties["ToolId"] + ") " + tool.ZollerProperties["Description"] + "</p>");
	var ul = document.createElement("ul");
	this.append(ul);
	tool.Article.ComponentList.forEach(component => {
		var componentImageUrl = "";
		if ((typeof component.Images[0]) !== "undefined"){
			componentImageUrl = component.Images[0].GetCustomImageURL();
		}
		var li = document.createElement("li");
		ul.appendChild(li);
		li.innerHTML = "<a href=\"" + componentImageUrl + "\" target=\"_blank\"><image width=\"50\" height=\"50\" style=\"object-fit: contain;\" src=\"" + componentImageUrl + "\" /></a>" + "(" + component.ZollerProperties["ComponentId"] + ") " + component.ZollerProperties["Description"];
		var liUl = document.createElement("ul");
		li.appendChild(liUl);
		var customProperties = Object.getOwnPropertyNames(component.CustomProperties);
		customProperties.forEach(propName => {
			var liUlLi = document.createElement("li");
			liUl.appendChild(liUlLi);
			liUlLi.innerHTML = "<u>" + propName + "</u>: " + component.CustomProperties[propName];
			
		});
	});
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


Zoller = {
	Preferences: {
		XMLDeclaration: "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>",
		RequestBaseURL: window.location.origin + "/Zoller/Stream",
		WebServiceBaseURL: "http://server:8084/ZollerDbService/",
		ServiceInstance: null,
		DocumentList: null,
		ArticleCharacteristicBars: null,
		UserName: "zoller",
		UserPassword: "zoller"
	},
		Request: {
			CreateAuthorization: function(method, query){
				this.Method = method;
				this.Date = (new Date()).getRFC2616();
				this.User64 = function(){
					return btoa(Zoller.Preferences.UserName);
				}
				this.Request = query;
				this.StringToSign = function(){
					return this.Method + "\n" + this.Date + "\n" + "/ZollerDbService/" + this.Request;
				}
				this.Signiture = function(){
					return b64_hmac_sha1(Zoller.Preferences.UserPassword, this.StringToSign());
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
				var url = Zoller.Preferences.RequestBaseURL;
				if (async == undefined) { async = false; }
				//data = {"url": encodeURIComponent(Zoller.Preferences.WebServiceBaseURL + query), "method": method, "data": data};
				$.ajax({
					url: url + "?url=" + btoa(Zoller.Preferences.WebServiceBaseURL + query) + "&method=" + method + "&data=" + (data ? JSON.stringify(data) : ""),
					method: "post",
					dataType: "xml",
					contentType: "application/json; charset=utf-8",
					async: async,
					success: function(response){
						console.log("FromProxy Success: ", response);
					},
					error: function(response){
						console.log("FromProxy Error: ", response);
					}
				});
			},
			FromService: function(method, query, callback,data, async){
				console.log("[Zoller.Preferences.Request.FromService] This is an experimental function and requires that the TMS Web Service allows CORS!");
				var xhr = new XMLHttpRequest();
				
				if (xhr.withCredentials !== undefined){
					xhr.open(method, Zoller.Preferences.WebServiceBaseURL + query, async);
				} else if (typeof XDomainRequest != "undefined"){
					xhr = new XDomainRequest();
					xhr.open(method, Zoller.Preferences.WebServiceBaseURL + query);
				} else{
					xhr = null;
				}
				
				if (async == undefined) { async = false; }
				xhr.open(method, Zoller.Preferences.WebServiceBaseURL + query, async);
				xhr.withCredentials = true;
				xhr.setRequestHeader("Content-Type", "application/xml");
				var auth = Zoller.Preferences.Request.CreateAuthorization(method, query);
				xhr.setRequestHeader("Authorization", auth.ToString());
				xhr.setRequestHeader("x-zws-date", auth.Date);
				var loc = Zoller.Preferences.WebServiceBaseURL;//window.location.toString();
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
		}
}

Zoller.Preferences = {}


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
			if (strExpression != "" && strExpression != undefined){
				strQuery = strQuery + "&expression=" + strExpression;
			}
			var objs = [];
			Zoller.Preferences.Request.FromProxy("GET", strQuery, function(xml){
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
			Zoller.Preferences.Request.FromProxy("GET", strQuery, function(xml){
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