  <WebMethod()> _
  <ScriptMethod(ResponseFormat:=ResponseFormat.Xml)> _
  Public Function SetZoller(ByVal URL As String, ByVal Method As String, ByVal Data As String) As XmlDocument
    Dim s As HttpWebRequest
    Dim enc As UTF8Encoding
    Dim postdata As String
    Dim postdatabytes As Byte()
    s = HttpWebRequest.Create(Uri.UnescapeDataString(URL)) '' Clean any incoming url
    enc = New System.Text.UTF8Encoding()
    postdata = Uri.UnescapeDataString(Data) '' Clean any incoming data
    postdatabytes = System.Text.Encoding.ASCII.GetBytes(postdata)

    s.Method = Method '' Set method based on what web request requested
    Dim un, pw, req, dat, hsh, UserName, PassWord, nl As String
    Dim nls() As String = {"\n", vbLf, vbCr, vbCrLf, vbNewLine, Environment.NewLine}
    UserName = "zoller" '' Change as necessary
    PassWord = "zoller" '' Change as necessary
    un = Convert.ToBase64String(enc.GetBytes(UserName))
    '' Start getting the request string for the Authorization
    req = URL.Remove(0, URL.IndexOf("/ZollerDbService"))
    If req.Contains("?") Then
      req = req.Remove(req.IndexOf("?"))
    ElseIf req.EndsWith("/") Then
      req = req.Remove(req.LastIndexOf("/"))
    End If
    '' Generate appropriate StringToSign value 'zm3bxl
    dat = DateTime.Now.ToString("R")
    '' Benchmark shows that vbLf is effective for Authorization hash
    nl = nls(1)
    hsh = Method & nl & dat & nl & req
    pw = HashString(hsh, PassWord) 'Convert.ToBase64String(enc.GetBytes("")) '' User Base64 conversion for unencrypted connection
    s.Date = dat
    s.Headers.Add("x-zws-date", dat)
    s.Headers.Add("Authorization", "ZWS " & un & ":" & pw)
    's.Headers.Add("x-zws-client-type", "TDM") '' Specify Article Characteristic type as necessary
    s.ContentType = "text/xml"

    If Not String.IsNullOrEmpty(Data) And Not Data = "undefined" Then '' Check if data was sent and if we should relay the data
      s.ContentLength = postdatabytes.Length
      Using stream = s.GetRequestStream()
        stream.Write(postdatabytes, 0, postdatabytes.Length)
      End Using
    End If

    Dim myOut As New XmlDocument() '' Prepare response
    Dim myRoot As XmlElement = myOut.CreateElement("Response")
    Dim result As HttpWebResponse
    Dim blnGetResponseFailed As Boolean = False '' Used later to try again... Just in case

    Try
      result = s.GetResponse()
    Catch ex As Exception
      blnGetResponseFailed = True
    End Try

    If Not IsNothing(result) And s.HaveResponse Then
      Using stream = result.GetResponseStream()
        Dim strXML As String = New IO.StreamReader(stream).ReadToEnd() '' Get any data (existing or not). Zoller TMS does not respond when creating/updating successfully
        If Not String.IsNullOrEmpty(strXML) Then
          myOut.LoadXml(strXML.Trim()) '' Load Zoller response
        Else
          myRoot.Attributes.Append(myOut.CreateAttribute("result")).Value = "success" '' Custom response flagged as successful
          myRoot.InnerText = result.StatusDescription
          myOut.AppendChild(myRoot)
        End If
      End Using
    Else '' Something probably went wrong, so let's generate a troubleshooting response with pertinent data and an Authorization benchmark based on the Web Service documentation examples
      myRoot.Attributes.Append(myOut.CreateAttribute("result")).Value = "fail"
      myRoot.Attributes.Append(myOut.CreateAttribute("getResponseFailed")).Value = blnGetResponseFailed.ToString
      myRoot.AppendChild(myOut.CreateElement("URL")).InnerText = s.RequestUri.AbsoluteUri
      myRoot.AppendChild(myOut.CreateElement("Method")).InnerText = s.Method
      myRoot.AppendChild(myOut.CreateElement("ContentType")).InnerText = s.ContentType
      myRoot.AppendChild(myOut.CreateElement("ContentLength")).InnerText = s.ContentLength
      myRoot.AppendChild(myOut.CreateElement("Receieved")).InnerText = s.HaveResponse.ToString
      If s.HaveResponse And Not IsNothing(result) Then
        myRoot.AppendChild(myOut.CreateElement("StatusCode")).InnerText = result.StatusCode.ToString
        myRoot.AppendChild(myOut.CreateElement("StatusDescription")).InnerText = result.StatusDescription
      ElseIf s.HaveResponse Then
        myRoot.AppendChild(myOut.CreateElement("ResponseStatus")).InnerText = "Response Received, but 'result' was nothing."
        Try
          result = s.GetResponse()
          myRoot.AppendChild(myOut.CreateElement("ResponseAgain")).InnerText = "Received Response succesfully"
        Catch ex As Exception
          myRoot.AppendChild(myOut.CreateElement("ResponseAgain")).InnerText = "Failed to get response again"
        End Try
      End If
      myRoot.AppendChild(myOut.CreateElement("ReceivedData")).InnerText = postdata.Replace("&lt;", "<").Replace("&gt;", ">")
      myRoot.AppendChild(myOut.CreateElement("Authorization")).InnerText = s.Headers.Item("Authorization")
      myRoot.AppendChild(myOut.CreateElement("Request")).InnerText = req
      myRoot.AppendChild(myOut.CreateElement("DateString")).InnerText = (DateTime.Now.ToString("R"))
      myRoot.AppendChild(myOut.CreateElement("Password")).InnerText = PassWord
      myRoot.AppendChild(myOut.CreateElement("HashString")).InnerText = hsh
      For i = 0 To nls.Length - 1 Step 1 '' Iterate through possible "\n" characters to determine correct character
        '' NOTE: Use the following values to try and generate the correct Authorization "password" as '1EeqO8uYHU4OrnUjul9EgbSKYnw='
        ''    PassWord  = zoller
        ''    Method    = GET
        ''    dat       = Fri, 18 Jun 2010 13:15:21 GMT
        ''    req       = /ZollerDbService/Tool
        '' The correct response should be in node 'RE1.1'
        myRoot.AppendChild(myOut.CreateElement("RE" & i.ToString & ".0")).InnerText = HashString(PassWord, Method & nls(i) & dat & nls(i) & req)
        myRoot.AppendChild(myOut.CreateElement("RE" & i.ToString & ".1")).InnerText = HashString(Method & nls(i) & dat & nls(i) & req, PassWord)
      Next
      myOut.AppendChild(myOut.CreateXmlDeclaration("1.0", "utf-8", "yes"))
      myOut.AppendChild(myRoot)
    End If

    Return myOut
  End Function

  Private Function HashString(ByVal StringToHash As String, ByVal HashKey As String) As String
    Dim myEncoder As New System.Text.UTF8Encoding
    Dim Key() As Byte = myEncoder.GetBytes(HashKey)
    Dim Text() As Byte = myEncoder.GetBytes(StringToHash)
    Dim myHMACSHA1 As New System.Security.Cryptography.HMACSHA1(Key)
    Dim HashCode As Byte() = myHMACSHA1.ComputeHash(Text)
    Dim hash As String  = Convert.ToBase64String(HashCode)
    Return hash
  End Function