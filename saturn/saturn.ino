#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFiClientSecure.h>
#include "DHTesp.h"

const char HOST[] = "https://smafore.hurin.work/api/v1/conditions";
//const char HOST[] = "http://192.168.11.7:3000/api/v1/conditions";
const char* AMAZON_CERT = \
  "-----BEGIN CERTIFICATE-----\n" \
"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\n" \
"-----END CERTIFICATE-----\n";

DHTesp dht;
Preferences preferences;
int dhtPin = 25;
const long ENV_UPDATE_INTERVAL = 20000;

String getValue(const char* key) {
  preferences.begin("app", false);
  String ssid = preferences.getString(key, "default");
  long startTime = millis();

  {
    char buffer[100];
    sprintf(buffer, "Please set to %s :", key);
    Serial.println(buffer);
 
    while((millis() - startTime) < ENV_UPDATE_INTERVAL) {
      if (Serial.available() > 0) {
        String input = Serial.readStringUntil('\n');

	if (input.length() > 0) {
	  ssid = input;
	  preferences.putString(key, input);
          return ssid; 
	}
      }
      delay(10);
    }
  }

  preferences.end();
  return ssid;
}

boolean connectWiFi(char * ssid, char * pass) {
  
  WiFi.begin(ssid, pass);
  Serial.print("WiFi connecting [");
  Serial.print(ssid);
  Serial.print(pass);
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

  String ssid = getValue("SSID");
  int slen = ssid.length();
  char cnv_ssid[slen];
  ssid.toCharArray(cnv_ssid, slen + 1);
  String pass = getValue("PASS");
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
  httpc.begin(HOST, AMAZON_CERT);
  httpc.addHeader("Content-Type", "application/json");
  int status = httpc.POST(body);

  Serial.println(body);
  Serial.println(status);
  delay(300000);
}
