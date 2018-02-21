public System.Xml.XmlDocument ZollerProxy(string URL, string Method, string Data){
	HttpWebRequest s;
	UTF8Encoding enc;
	string postdata;
	Byte[] postdatabytes;
	s = (HttpWebRequest)HttpWebRequest.Create(Uri.UnescapeDataString(URL));
	enc = new UTF8Encoding();
	postdata = Uri.UnescapeDataString(Data);
	postdatabytes = Encoding.ASCII.GetBytes(postdata);

	s.Method = Method;
	DateTime now = DateTime.Now;
	string un, pw, req, dat, hsh, UserName, PassWord, nl;
	nl = "\n";
	UserName = "zoller";
	PassWord = "zoller";
	un = Convert.ToBase64String(enc.GetBytes(UserName));
	req = URL.Remove(0, URL.IndexOf("/ZollerDbService"));
	if (req.Contains("?")) {
		req = req.Remove(req.IndexOf("?"));
	}else if (req.EndsWith("/")){
		req = req.Remove(req.LastIndexOf("/"));
	}
	dat = now.ToString("R");
	hsh = Method + nl + dat + nl + req;
	pw = HashString(hsh, PassWord);
	s.Date = now;
	s.Headers.Add("x-zws-date", dat);
	s.Headers.Add("Authorization", "ZWS " + un + ":" + pw);
	s.ContentType = "text/xml";
	if (!string.IsNullOrEmpty(Data) && Data != "undefined"){
		s.ContentLength = postdatabytes.Length;
		using (var stream = s.GetRequestStream()){
			stream.Write(postdatabytes, 0, postdatabytes.Length);
		}
	}

	var myOut = new System.Xml.XmlDocument();
	System.Xml.XmlElement myRoot = myOut.CreateElement("Response");
	HttpWebResponse result = null;
	bool blnGetResponseFailed = false;

	try{
		result = (HttpWebResponse)s.GetResponse();
	}catch (Exception ex){
		blnGetResponseFailed = true;
	}

	if (result != null && s.HaveResponse){
		using (var stream = result.GetResponseStream()){
			string strXML = new System.IO.StreamReader(stream).ReadToEnd();
			if (!string.IsNullOrEmpty(strXML.Trim())){
				myOut.LoadXml(strXML.Trim());
			}else{
				myRoot.Attributes.Append(myOut.CreateAttribute("result")).Value = "success";
				myRoot.InnerText = result.StatusDescription;
				myOut.AppendChild(myRoot);
			}
		}
	}else{
		myRoot.Attributes.Append(myOut.CreateAttribute("result")).Value = "fail";
		myRoot.Attributes.Append(myOut.CreateAttribute("getResponseFailed")).Value = blnGetResponseFailed.ToString();
		myRoot.AppendChild(myOut.CreateElement("URL")).InnerText = s.RequestUri.AbsoluteUri;
		myRoot.AppendChild(myOut.CreateElement("Method")).InnerText = s.ContentType;
		myRoot.AppendChild(myOut.CreateElement("ContentLength")).InnerText = s.ContentLength.ToString();
		myRoot.AppendChild(myOut.CreateElement("Receieved")).InnerText = s.HaveResponse.ToString();
		if (s.HaveResponse && result != null){
			myRoot.AppendChild(myOut.CreateElement("StatusCode")).InnerText = result.StatusCode.ToString();
			myRoot.AppendChild(myOut.CreateElement("StatusDescription")).InnerText = result.StatusDescription.ToString();
		}else if(s.HaveResponse){
			myRoot.AppendChild(myOut.CreateElement("ResponseStatus")).InnerText = "Response Received, but 'result' was nothing.";
			try{
				result = (HttpWebResponse)s.GetResponse();
				myRoot.AppendChild(myOut.CreateElement("ResponseAgain")).InnerText = "Received Response successfully.";
			}catch (Exception ex){
				myRoot.AppendChild(myOut.CreateElement("ResponseAgain")).InnerText = "Failed to get response again.";
			}
		}
		myRoot.AppendChild(myOut.CreateElement("ReceivedData")).InnerText = postdata.Replace("&lt;", "<").Replace("&gt;", ">");
		myRoot.AppendChild(myOut.CreateElement("Authorization")).InnerText = s.Headers["Authorization"];
		myRoot.AppendChild(myOut.CreateElement("Request")).InnerText = req;
		myRoot.AppendChild(myOut.CreateElement("DateString")).InnerText = (dat);
		myRoot.AppendChild(myOut.CreateElement("Password")).InnerText = PassWord;
		myRoot.AppendChild(myOut.CreateElement("HashString")).InnerText = hsh;
		myRoot.AppendChild(myOut.CreateElement("RE0")).InnerText = HashString(PassWord, Method + nl + dat + nl + req);
		myRoot.AppendChild(myOut.CreateElement("RE1")).InnerText = HashString(Method + nl + dat + nl + req, PassWord);
		myOut.AppendChild(myOut.CreateXmlDeclaration("1.0", "utf-8", "yes"));
		myOut.AppendChild(myRoot);
	}
	return myOut;
}
private string HashString(string StringToHash, string HashKey){
	var myEncoder = new System.Text.UTF8Encoding();
	Byte[] key = myEncoder.GetBytes(HashKey);
	Byte[] text = myEncoder.GetBytes(StringToHash);
	var myHMACSHA1 = new System.Security.Cryptography.HMACSHA1(key);
	Byte[] HashCode = myHMACSHA1.ComputeHash(text);
	return Convert.ToBase64String(HashCode);
}