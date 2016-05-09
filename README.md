# ZollerTMS-JS
A JavaScript library to receive and objectify data from a Zoller TMS Web Service.

# Background
This library provides simple functions to interface with Zoller's TMS Web Service. The JavaScript library relies on a server-side method to carry out communication with the TMS Web Service, so a .NET Web Method has been included in the **Zoller Interface_Server.vb** file.

# Usage

## Connecting to the TMS Web Service
In order to properly use this library, ensure that a Web Method similar to the one provided is available. Some key things to consider if creating your own:

 - Ensure the method handles Encrypted and Unencrypted Authorization according to the standard expressed in the TMS Web Service documentation.
 - Include parameters that the library's *_WebRequest* function can perform:
  - URL
	- Method
	- Data
 - Handle when Zoller doesn't provide a response for POST/PUT method synopsis

With a Web Method available, the next step is to change the *_WebRequest* method/settings to meet the conditions of your network:

 - Set *_RequestBaseURL* to the URL of your Web Method
  - IE. **http://server:8080/ZollerInterface.asmx/SetZoller**
 - Set *_WebServiceBaseURL* to the URL of the Zoller TMS Web Service
  - IE. **http://server:8081/ZollerDbService/**
 - Change the *Content-Type* as necessary. For the .NET Web Method provided, the default is okay.
 - If you created your own Web Method, change any necessary parameters

Ultimately the only thing to be concerned with in the *_WebRequest* method is that the raw XML from the Zoller TMS Web Service is returned in the callback function.

## Using the Objects
Most **Zoller%** objects require either the Zoller TMS ID string or the raw XML of the object's data. These objects include:

 - ZollerAdapter
 - ZollerMachine
 - ZollerSettingSheet
 - ZollerTool
 - ZollerSingleComponent
 - ZollerAccessory

The remaining **Zoller%** objects only accept the raw XML of the object's data. These objects include:

 - ZollerDocument
 - ZollerCharacteristicStructure
 - ZollerCharacteristicItem

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
The **ZollerTool** object now contains a *DrawHTML()* function. This functions generates a GUI that represents the Tool and its Single Components. The controls created by this method can overwrite or append based on the provided parent element and the overwrite flag when calling the function. Each element is given the appropriate class (used in **Zoller Interface.css**). The provided classes are used in the **SetHandlers()** function, which... sets the event handlers.

For example, if you get a **ZollerSettingSheet** using:

```javascript
var ss = new ZollerSettingSheet("84");
```

we can iterate through the list of tools and append the details in the document body:

```javascript
for (var len = ss.Tools.length, n = 0; n < len; n++){
	ss.Tools[n].DrawHTML("md", document.body);
}
```

resulting in <sub>(This will depend on the data in your Zoller TMS and which Setting Sheet you specify for 'ss')</sub>:
![DrawHTML Example](https://raw.githubusercontent.com/tbm0115/ZollerTMS-JS/master/DrawHTML%20Result.PNG)

## SetHandlers()
The **SetHandlers()** function globaly sets the handlers for the appropriate elements generated by **DrawHTML()**. Here's the list of subjects handled in the function: 

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


## Things to consider
Currently there is not a strong set of methods to allow updating/creating data. So, considering the example above, you cannot edit the *Description* of **T1** using the library and update the TMS. However, a method can be added to the *Tool* object that performs such a task using the *_WebRequest* method as POST/PUT/DELETE methods can be sent using the Web Method provided.
