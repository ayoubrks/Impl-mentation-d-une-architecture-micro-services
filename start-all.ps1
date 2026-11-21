$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$mvnCmd = "C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.3\plugins\maven\lib\maven3\bin\mvn.cmd"
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    $mvnCmd = "mvn"
}

$services = @(
    "discovery-service",
    "config-service",
    "customer-service",
    "inventory-service",
    "billing-service",
    "gateway-service"
)

Write-Host "=== Packaging des micro-services Java ===" -ForegroundColor Cyan
foreach ($svc in $services) {
    Write-Host "Packaging $svc..."
    & $mvnCmd -f "$PSScriptRoot\$svc\pom.xml" package -DskipTests -q
    if ($LASTEXITCODE -ne 0) {
        throw "Echec du packaging pour $svc"
    }
}

function Wait-Port($port, $name) {
    Write-Host "Attente de $name sur le port $port..." -ForegroundColor Yellow
    for ($i = 0; $i -lt 60; $i++) {
        $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($conn.TcpTestSucceeded) {
            Write-Host "$name est pret sur le port $port." -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "Timeout en attendant $name sur le port $port"
}

$javaExe = "$env:JAVA_HOME\bin\java.exe"

Write-Host "=== Demarrage des micro-services ===" -ForegroundColor Cyan
Start-Process -FilePath $javaExe -ArgumentList "-jar", "$PSScriptRoot\discovery-service\target\discovery-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\discovery-service" -WindowStyle Minimized
Wait-Port 8761 "discovery-service"

Start-Process -FilePath $javaExe -ArgumentList "-jar", "$PSScriptRoot\config-service\target\config-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot" -WindowStyle Minimized
Wait-Port 9999 "config-service"

Start-Process -FilePath $javaExe -ArgumentList "-jar", "$PSScriptRoot\customer-service\target\customer-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\customer-service" -WindowStyle Minimized
Start-Process -FilePath $javaExe -ArgumentList "-jar", "$PSScriptRoot\inventory-service\target\inventory-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\inventory-service" -WindowStyle Minimized
Wait-Port 8081 "customer-service"
Wait-Port 8082 "inventory-service"

Start-Process -FilePath $javaExe -ArgumentList "-jar", "$PSScriptRoot\billing-service\target\billing-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\billing-service" -WindowStyle Minimized
Start-Process -FilePath $javaExe -ArgumentList "-jar", "$PSScriptRoot\gateway-service\target\gateway-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\gateway-service" -WindowStyle Minimized
Wait-Port 8083 "billing-service"
Wait-Port 8888 "gateway-service"

Write-Host "=== Demarrage du client Angular (port 4200) ===" -ForegroundColor Cyan
Start-Process -FilePath "npm.cmd" -ArgumentList "start" -WorkingDirectory "$PSScriptRoot\angular-front-app" -WindowStyle Minimized
Wait-Port 4200 "angular-front-app"

Write-Host "Tous les services sont demarres !" -ForegroundColor Green
Write-Host "- Eureka:   http://localhost:8761"
Write-Host "- Config:   http://localhost:9999/customer-service/default"
Write-Host "- Gateway:  http://localhost:8888/billing-service/fullBills"
Write-Host "- Angular:  http://localhost:4200"
