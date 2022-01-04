#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFiClientSecure.h>
#include "DHTesp.h"

const char HOST[] = "https://smafore.tatikaze.com/api/v1/conditions";
//const char HOST[] = "http://192.168.11.7:3000/api/v1/conditions";
const int PORT = 3000;
const char* AMAZON_CERT = \
  "-----BEGIN CERTIFICATE-----\n" \
"MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF\n" \
"ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6\n" \
"b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL\n" \
"MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv\n" \
"b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj\n" \
"ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM\n" \
"9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw\n" \
"IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6\n" \
"VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L\n" \
"93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm\n" \
"jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC\n" \
"AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA\n" \
"A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI\n" \
"U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs\n" \
"N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv\n" \
"o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU\n" \
"5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy\n" \
"rqXRfboQnoZsG4q5WTP468SQvvG5\n" \
"-----END CERTIFICATE----- \n";

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
  httpc.begin(HOST, AMAZON_CERT);
  httpc.addHeader("Content-Type", "application/json");
  int status = httpc.POST(body);

  Serial.println(body);
  Serial.println(status);
  delay(300000);
}
