# ZollerTMS-JS
A JavaScript library to receive and objectify data from a Zoller TMS Web Service.

# Background
This library provides simple functions to interface with Zoller's TMS Web Service. The JavaScript library relies on a server-side method to carry out communication with the TMS Web Service, so a .NET Web Method has been included in the **Zoller Interface_Server.vb** file.

# Usage

## Global properties and methods
The **ZollerGlobal** object holds many of the Zoller-specify properties and some of the globaly used methods.
**ZollerGlobal.**:
 - **Graphics**: Contains various graphic-driving variables. Mostly used for **DrawHTML()** methods.
  - **Suffixes**: Refers to the list of graphics available for each module object.
	- **PreviewSize**: Refers to the possible customization of the thumbnail sizes for images.
	- **Sizes**: Refers to the possible customization of the **DrawHTML()** element sizes. Related to the Zoller Interface.css.
	- **DefaultSize**: Sets the default **Sizes** setting.
	- **AllowEdit**: Determines whether **DrawHTML()** methods will include interfaces that could possibly edit the object such as Delete, Add objects, etc.
 - **XMLDeclaration**: This is a fail-safe in case the XHR response does not come with the declaration.
 - **RequestBaseURL**: Refers to the URL of the proxy method to use in web requests.
 - **WebServiceBaseURL**: Refers to the URL of the Zoller TMS web service.
 - **ServiceInstance**: A reference to the web service details response. Equivelant to querying *http://{server}:{port}/{ServiceName}/service-instance/*.
 - **DocumentList**: A reference to all documents located within the Web Service public document system (See DbService configuration).
 - **UserName**: Sets the preferred username to use with any web request.
 - **UserPassword**: Sets the preferred user's password to use with any web request.
 - **Request**: Provides web request methods.
  - **CreateAuthorization**: Compiles global variables and parameters into the appropriate RFC 2104 HMAC-SHA1 authorization string. Returns an object, breaking down each segment of the Authorization string. User **CreateAuthorization().ToString()** to get the full authorization string.
  - **FromProxy(method, query[, callback, data, async=false])**: Creates a web request through a proxy to the Zoller TMS web service.
   - **method**: Sets the HTTP request method (GET, POST, DELETE, etc.)
	 - **query**: Sets the Zoller TMS web service query. This is appended to the **WebServiceBaseURL**, so *Accessory* would result in *http://{server}:{port}/{ServiceName}/Accessory* in the web request.
	 - **callback**: (Optional) Specifies a callback method to receive the *responseXML* from the *XMLHttpRequest*.
	 - **data**: (Optional) Sets any data that should be sent to the web service. Typically for updating or creating data in Zoller via the Web Service.
	 - **async**: (Optional) Specifies whether the web service should run asynchronously or not. This is false by default.
  - **FromService(method, query[, callback, async])**: (Experimental) Creates a web request directly to the Zoller TMS web service. (See *FromProxy* for details on the parameters)
 - **Set**: Provides methods for setting up handlers on controls made by **DrawHTML()**.
  - **DragSourceElement**: A placeholder for possible drag/drop events.
	- **Handlers()**: Sets up all possible Zoller interface handlers.
	- **Handler(query, onevent, callback)**: Sets up a specific handler on a series of elements.
	 - **query**: Specifies the query to be run in *document.querySelectorAll()* method.
	 - **onevent**: Specifies which event should be raised.
	 - **callback**: Specifies which method should be raised by the event.
	- **EditState**: Toggles the some of the editable functionality in the interfaces made by **DrawHTML()**.
 - **Raise**: Provides methods for raising specific Zoller object-related events. (See *Set.Handlers()*). There should be a breakdown relative to each Zoller object that has **DrawHTML()**.


## Connecting to the TMS Web Service
In order to properly use this library, ensure that a proxy Web Method similar to the one provided is available. Some key things to consider if creating your own:

 - Ensure the method handles Encrypted and Unencrypted Authorization according to the standard expressed in the TMS Web Service documentation.
 - Include parameters that the library's *ZollerGlobal.Request.FromProxy* function can perform:
  - URL
	- Method
	- Data
 - Handle when Zoller doesn't provide a response for POST/PUT methods

With a proxy Web Method available, the next step is to change the *ZollerGlobal.Request.FromProxy* method/settings to meet the conditions of your network:

 - Set *ZollerGlobal.RequestBaseURL* to the URL of your Web Method
  - IE. **http://server:8080/ZollerInterface.asmx/SetZoller**
 - Set *ZollerGlobal.WebServiceBaseURL* to the URL of the Zoller TMS Web Service
  - IE. **http://server:8081/ZollerDbService/**
 - Change the *Content-Type* as necessary. For the .NET Web Method provided, the default is okay.
 - If you created your own Web Method, change any necessary parameters

Ultimately the only thing to be concerned with in the *ZollerGlobal.Request.FromProxy* method is that the raw XML from the Zoller TMS Web Service is returned in the callback function.

## Using the Objects
Most **Zoller%** objects require either the Zoller TMS ID string or the raw XML of the object's data. These objects include:

 - **ZollerAdapter**
  - *isNull* (Boolean)
  - *AdapterId* (String)
	- *Name* (String)
	- *AdapterType* (String)
	- *Images* (Array(Of ZollerGraphicImage))
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *AdapterPresetter* (String)
 - **ZollerMachine**
  - *isNull* (Boolean)
	- *MachineId* (String)
	- *Name* (String)
	- *Description* (String)
	- *MagazineCapacity* (String)
	- *NCToDirectory* (String)
	- *NCFromDirectory* (String)
	- *MachineType* (String)
	- *Manufacturer* (String)
	- *Images* (Array(Of ZollerGraphicImage))
	- *Tools* (Array(Of ZollerTool))
	- *SettingSheets* (Array(Of ZollerSettingSheet))
	- *Accessories* (Array(Of ZollerAccessory))
	- *Adapters* (Array(Of ZollerAdapter))
	- *Documents* (Array(Of ZollerDocument))
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *NoOfMagazinPositions* (String)
	- *NcProgrammTransferPath* (String)
	- *NcProgrammDeleteBeforeTransfer* (String)
	- *NcProgrammDeleteAfterTransfer* (String)
	- *NcProgrammTransferBackPath* (String)
	- *NcProgrammSplit* (String)
	- *UseTurningAdvisor* (String)
	- *PostProcessorId* (String)
	- *CommunicationDevice* (String)
	- *DatasetState* (String)
	- *Type* (String)
	- *Manufacturer* (String)
 - **ZollerSettingSheet**
  - *isNull* (Boolean)
	- *SettingSheetId* (String)
	- *Name* (String)
	- *WorkStep* (String)
	- *Machine*
	- *Images* (Array(Of ZollerGraphicImage))
	- *Tools* (Array(Of ZollerTool))
	- *Fixtures* (Array(Of ZollerFixture))
	- *MeasuringDevicesV2* (Array(Of ZollerMeasuringDeviceV2))
	- *Documents* (Array(Of ZollerDocument))
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *DatasetState* (String)
	- *InvMode* (String)
	- *InvPhysical* (String)
	- *InvFullCopy* (String)
 - **ZollerTool**
  - *isNull* (Boolean)
	- *ToolId* (String)
	- *Description* (String)
	- *CharacteristicStructures* (Array(Of ZollerArticleCharacteristicStructure))
	- *Images* (Array(Of ZollerGraphicImage))
	- *SingleComponents* (Array(Of ZollerSingleComponent))
	- *Accessories* (Array(Of ZollerAccessory))
	- *Documents* (Array(Of ZollerDocument))
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *TNo* (String)
	- *LongComment* (String)
	- *Wobble* (String)
	- *DxfDisplayMode* (String)
	- *VerifiedForMeasuring* (String)
	- *IsLifetimeExpired* (String)
	- *DxfDoMirrowX* (String)
	- *DxfDoMirrowY* (String)
	- *DxfDoRotate* (String)
	- *DxfRotateAngl* (String)
	- *AxialRunOut* (String)
	- *IsPartsExpired* (String)
	- *UseTurningAdvisor* (String)
	- *TAAdapterSwapped* (String)
	- *DatasetState* (String)
	- *InvMode* (String)
	- *InvPhysical* (String)
	- *InvFullCopy* (String)
	- *UsedAdapterId* (String)
	- *UsedAdapterName* (String)
	- *SVG* (SVGDom)
	- *__GetXML()__* (String)
  - *__DrawHTML([size, theme, parent, overwrite])__* (HTMLDom)
	- *__Convert(newUnits)__ * (Object)
 - **ZollerSingleComponent**
  - *isNull* (Boolean)
	- *ComponentId* (String)
	- *Description* (String)
	- *CharacteristicStructures* (Array(Of ZollerArticleCharacteristicStructure))
	- *Images* (Array(Of ZollerGraphicImage))
	- *Accessories* (Array(Of ZollerAccessory))
	- *Documents* (Array(Of ZollerDocument))
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *PartClass* (String)
	- *SubjectNo* (String)
	- *Norm* (String)
	- *LongComment* (String)
	- *StorageUse* (String)
	- *InterfaceCodingToolSide* (String)
	- *InterfaceCodingMachineSide* (String)
	- *GeneratedInterfaceCodingMachineSide* (String)
	- *CouplingUseCharacteristic* (String)
	- *DatasetState* (String)
	- *InvMode* (String)
	- *InvPhysical* (String)
	- *InvFullCopy* (String)
	- *SVG* (SVGDom)
	- *__Convert(newUnits)__* (Object)
 - **ZollerAccessory**
  - *isNull* (Boolean)
	- *AccessoryId* (String)
	- *Description* (String)
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *CanDelete* (Boolean)
	- *LongComment* (String)
	- *Standard* (String)
	- *Lifetime* (String)
	- *Image* (ZollerGraphicImage)
	- *Documents* (Array(Of ZollerDocument))
	- *__GetJSON()__* (String)
  - *__DrawHTML([size, theme, parent, overwrite])__* (HTMLDom)
 - **ZollerFixture**
  - *isNull* (Boolean)
	- *FixtureId* (String)
	- *Description* (String)
	- *Fixtures* (Array(Of ZollerFixture))
	- *Accessories* (Array(Of ZollerAccessory))
	- *Documents* (Array(Of ZollerDocument))
	- *CustomProperties* (Array(Of Object))
	- *IsTrueZoller* (Boolean)
	- *CanDelete* (Boolean)
	- *ClampingDescription* (String)
	- *DrawingNo* (String)
	- *Weight* (String)
	- *IsFixtureActive* (String)
	- *IsSubFixture* (String)
	- *StorageLocation* (String)
	- *DatasetState* (String)
	- *InvMode* (String)
	- *InvPhysical* (String)
	- *InvFullCopy* (String)
	- *LongComment* (String)
	- *Image* (ZollerGraphicImage)
	- *__GetJSON()__* (String)
	- *__DrawHTML([size, theme, parent, overwrite])__* (HTMLDom)
	- * __DrawHTMLList([size, theme, parent, overwrite])__* (HTMLDom)
  - *__DrawHTML([size, theme, parent, overwrite])__* (HTMLDom)
 - **ZollerMeasuringDeviceV2**
  - *isNull* (Boolean)
	- *MeasuringDeviceId* (String)
	- *Description* (String)
	- *Images* (Array(Of ZollerGraphicImage))
	- *Accessories* (Array(Of ZollerAccessory))
	- *Documents* (Array(Of ZollerDocument))
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *CanDelete* (Boolean)
	- *IsCalibrator* (String)
	- *InternalTest* (String)
	- *CheckDateInterval* (String)
	- *CheckUsageCount* (String)
	- *MeasuringDeviceStateAfterCalibration* (String)
	- *DatasetState* (String)
	- *MeasuringRangeMin* (String)
	- *MeasuringRangeMax* (String)
	- *MainTestValue* (String)
	- *MeasuringDeviceType* (String)
	- *MainTestValueUpperTol* (String)
	- *MainTestValueLowerTol* (String)
	- *MeasuringPrecision* (string) 
	- *InvFullCopy* (String)
	- *__GetJSON()__* (String)
  - *__DrawHTML([size, theme, parent, overwrite])__* (HTMLDom)
 - **ZollerStorage**
  - *isNull* (Boolean)
	- *StorageId* (String)
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *Width* (String)
	- *Height* (String)
	- *Depth* (String)
	- *ExternalSystemControl* (String)
	- *Type* (String)
	- *CirculationControl* (String)
	- *IsStockOrderNeeded* (String)
	- *DatasetState* (String)
	- *StoragePlace* (Object)
	 - *StoragePlaceBaseId* (String)
	 - *Description* (String)
 - **ZollerDocument**
  - *isNull* (Boolean)
	- *DocumentId* (String)
	- *CreationTime* (String)
	- *LastModified* (String)
	- *Size* (String)
	- *MimeType* (String)
	- *Location* (String)
	- *CustomProperties* (Array(Of Object))
	- *XML* (XMLDom)
	- *IsTrueZoller* (Boolean)
	- *__AddScript()__* (HTMLDom)
	- *__AddDataBlock()__* (HTMLDom)
 - **ZollerSubFixture**
  - *Position* (Integer)
	- *Quantity* (Integer)
	- *Fixture* (ZollerFixture)
 - **ZollerSubMeasuringDeviceV2**
  - *Position* (Integer)
	- *Quantity* (Integer)
	- *MeasuringDeviceV2* (ZollerMeasuringDeviceV2)
 - **ZollerSubAccessory**
  - *Position* (Integer)
	- *Quantity* (Integer)
	- *Accessory* (ZollerAccessory)


The remaining **Zoller%** objects only accept the raw XML of the object's data. These objects include:

 - **ZollerSubDocument**
  - *XML* (XMLDom)
	- *URI* (String)
 - **ZollerCharacteristicStructure**
  - *Type* (String)
	- *System* (String)
	- *Characteristics* (Array(Of Object))
	- *ArticleCharacteristicBar* (ZollerArticleCharacteristicBar)
	- *ArticleCharacteristicType* (ZollerArticleCharacteristicType)
 - **ZollerCharacteristicItem**
  - *Id* (String)
	- *Label* (String)
	- *Value* (String)
	- *ArticleCharacteristic* (ZollerArticleCharacteristic)
	- *Units* (String)

The only **Zoller%** object that does not adhere to these single-input objects is the **ZollerGraphicImage** which accepts the FilePath string and GraphicGroup string.

It is recommended to mostly interface with the first set of objects as they will fill themselves with all "Sub Data". For example, creating a new **ZollerSettingSheet** object by passing the Id of a SettingSheet will provide access to relavent data to the Setting Sheet, its Tool assemblies, the associated Machine, any external documents, and any graphics including the "Sub Data" of said objects.

You can test the library quickly from your Web Browser's console. Consider we have a Setting Sheet in the Zoller TMS with an ID of **84**. Setting Sheet **84** has two Tools with Id's **T1** and **T2**:

```javascript
>> var ss = new ZollerSettingSheet("84");
>> console.log(ss);
```

You'll notice that the declaration of *ss* will result in a list of node names from the raw XML if your Web Method is properly setup and the *console.log(ss)* command should yield a result similar to the following:

```javascript
<< Object { SetXML: ZollerSettingSheet/this.SetXML(), XML: XMLDocument, SettingSheetId: "84", Name: "1-2-3 BLOCK", WorkStep: "101", Images: Array[2], Tools: Array[2], Documents: Array[2], Machine: Object, AddTool: ZollerSettingSheet/this.AddTool() }
```

The key things to note are the objects within the **ZollerSettingSheet** object, the *SettingSheetId* equals the Id we provided and the *Tools* array has two items. If we reference the first item in the console we'll get the following results:

```javascript
>> ss.Tools[0]
<< Object { SetXML: ZollerTool/this.SetXML(), XML: <Tool>, ToolId: "T1", Description: "2'' Gold Quad 5 FL", CharacteristicStructures: Array[1], Images: Array[2], SingleComponents: Array[3], Accessories: Array[2], Documents: Array[2], SVG: "&lt;?xml version="1.0"?&gt; &lt;svg…", 1 more… }
```

Here, you'll notice that not only is the correct *ToolId* represented, but all subsequent data of the TMS object as well.

## DrawHTML()
The **ZollerTool**, **ZollerAccessory**, **ZollerFixture**, and **ZollerMeasuringDeviceV2** objects now contain a *DrawHTML()* function. This function generates a GUI that represents the object and its sub-objects (ie. Single Components, Sub-Fixtures, Accessories, etc.). The controls created by this method can overwrite or append based on the provided parent element and the overwrite flag when calling the function. Each element is given the appropriate class (used in **Zoller Interface.css**). The provided classes are used in the **ZollerGlobal.Set.Handlers()** function, which... sets the event handlers.

For example, if you get a **ZollerSettingSheet** using:

```javascript
var ss = new ZollerSettingSheet("84");
```

we can iterate through the list of tools and append the details in the document body:

```javascript
for (var len = ss.Tools.length, n = 0; n < len; n++){
	ss.Tools[n].DrawHTML("md", "dark", document.body);
}
```

resulting in <sub>(This will depend on the data in your Zoller TMS and which Setting Sheet you specify for 'ss')</sub>:
![DrawHTML Example](https://raw.githubusercontent.com/tbm0115/ZollerTMS-JS/master/DrawHTML%20Result.PNG)

A [CodePen](http://codepen.io/tbm0115/pen/wGLgXv) is available to view a sample interface.

## ZollerGlobal.Set.Handlers()
The **ZollerGlobal.Set.Handlers()** function globaly sets the handlers for the appropriate elements generated by **DrawHTML()**. Here's the list of subjects handled in the function: 

- Set drag/drop event handlers for *assembly-item* class items <sub>(Single Components)</sub>
  - DragStart
  - DragEnter
  - DragOver
  - DragLeave
  - Drop
  - DragEnd
- Sets handler to raise the custom event **componentselected** which signifies that a component item has been clicked and requests details.
- Sets handler to raise the custom event **componentdelete** which signifies that the delete button has been clicked and requests the Component be removed from the Tool.
- Sets handler to raise the custom event **tooldelete** which signifies that the remove button has been clicked and requests the Tool be removed from the document or Setting Sheet.
- Sets handler to toggle the **clicked** class for the *assembly-name* element (which represents the name/description of the Tool).
- Sets handler to raise the custom event **componentadd** which signifies that the Add Component button has been clicked and requests a Component be added to the Tool.
- Sets handler to raise the custom event **fixtureselected** which signifies that a given fixture has been clicked and request details.
- CSS function to properly show/animate a sub-list of Accessories in a Tool.
- CSS function to properly show/animate a sub-list of fixtures.
- CSS function to properly show/animate a sub-list of Accessories in a Fixture.
- Sets handler to raise the custom event **accessoryselected** which signifies that a given accessory has been clicked and requests details.

## Things to consider
Currently there is not a strong set of methods to allow updating/creating data. So, considering the example above, you cannot edit the *Description* of **T1** using the library and update the TMS. However, a method can be added to the *Tool* object that performs such a task using the *ZollerGlobal.Request.FromProxy* method as POST/PUT/DELETE methods can be sent using the Web Method provided.
