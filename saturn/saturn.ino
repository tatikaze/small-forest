#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include "DHTesp.h"

const char HOST[] = "https://smafore.tatikaze.com/api/v1/conditions";
const int PORT = 443;

DHTesp dht;
Preferences preferences;
int dhtPin = 25;

String getSSID() {
  preferences.begin("app", false);
  String ssid = preferences.getString("SSID", "default");
  if(ssid == "default") {
    Serial.println("Please set to WiFi SSID: ");
 
    String input = Serial.readString();
    while(input.length() == 0) {
      input = Serial.readStringUntil('\n');
    }
    ssid = input;
    preferences.putString("SSID", input);
  }
  preferences.end();
 
  return ssid;
}

String getPASS() {
  preferences.begin("app", false);
  String pass = preferences.getString("PASS", "default");
  if(pass == "default") {
    Serial.println("Please set to WiFi Password: ");
 
    String input = Serial.readString();
    while(input.length() == 0) {
      input = Serial.readStringUntil('\n');
    }
    pass = input;
    preferences.putString("PASS", input);
  }
  preferences.end();
 
  return pass;
}

boolean connectWiFi(char * ssid, char * pass) {
  
  WiFi.begin(ssid, pass);
  Serial.print("WiFi connecting [");
  Serial.print(ssid);
  Serial.print("]");

  while(WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }

  Serial.println("");
  Serial.print("connected IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

void setup() {
  Serial.begin(9600);
  delay(3000);
  Serial.println("");

  dht.setup(dhtPin, DHTesp::AM2302);

  String ssid = getSSID();
  int slen = ssid.length();
  char cnv_ssid[slen];
  ssid.toCharArray(cnv_ssid, slen + 1);
  String pass = getPASS();
  int plen = pass.length();
  char cnv_pass[plen];
  pass.toCharArray(cnv_pass, plen + 1);

  connectWiFi(cnv_ssid, cnv_pass);
}

void loop() {
  TempAndHumidity values = dht.getTempAndHumidity();
  String body = "{ \"id\": \"reid\", \"temperature\": ";
  body += values.temperature;
  body += ", \"humidity\": ";
  body += values.humidity;
  body += " }";

  HTTPClient httpc;
  httpc.begin(HOST, PORT);
  httpc.addHeader("Content-Type", "application/json");
  httpc.POST(body);

  Serial.println(body);
  delay(300000);
}
