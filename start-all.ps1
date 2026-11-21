param(
    [switch]$Build,
    [switch]$KeepAlive
)

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

New-Item -ItemType Directory -Force -Path "$PSScriptRoot\logs" | Out-Null

foreach ($svc in $services) {
    $jar = "$PSScriptRoot\$svc\target\$svc-0.0.1-SNAPSHOT.jar"
    if ($Build -or -not (Test-Path $jar)) {
        Write-Host "Packaging $svc..." -ForegroundColor Cyan
        & $mvnCmd -f "$PSScriptRoot\$svc\pom.xml" package -DskipTests -q
        if ($LASTEXITCODE -ne 0) {
            throw "Echec du packaging pour $svc"
        }
    }
}

function Wait-Port($port, $name) {
    Write-Host "Attente de $name sur le port $port..." -ForegroundColor Yellow
    for ($i = 0; $i -lt 60; $i++) {
        foreach ($h in @("127.0.0.1", "::1")) {
            try {
                $client = [System.Net.Sockets.TcpClient]::new($h, $port)
                $client.Close()
                Write-Host "$name est pret sur le port $port." -ForegroundColor Green
                return
            } catch {}
        }
        Start-Sleep -Seconds 2
    }
    throw "Timeout en attendant $name sur le port $port"
}

function Start-ServiceJar($name, $workdir) {
    $javaExe = "$env:JAVA_HOME\bin\java.exe"
    $jarRel = "target\$name-0.0.1-SNAPSHOT.jar"
    $outLog = "$PSScriptRoot\logs\$name.out.log"
    $errLog = "$PSScriptRoot\logs\$name.err.log"
    Start-Process -FilePath $javaExe -ArgumentList "-jar", $jarRel -WorkingDirectory $workdir -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden
}

Write-Host "=== Demarrage des micro-services ===" -ForegroundColor Cyan
Start-ServiceJar "discovery-service" "$PSScriptRoot\discovery-service"
Wait-Port 8761 "discovery-service"

Start-ServiceJar "config-service" "$PSScriptRoot\config-service"
Wait-Port 9999 "config-service"

Start-ServiceJar "customer-service" "$PSScriptRoot\customer-service"
Start-ServiceJar "inventory-service" "$PSScriptRoot\inventory-service"
Wait-Port 8081 "customer-service"
Wait-Port 8082 "inventory-service"

# Petit delai pour que Eureka enregistre customer-service et inventory-service avant billing-service
Start-Sleep -Seconds 5

Start-ServiceJar "billing-service" "$PSScriptRoot\billing-service"
Start-ServiceJar "gateway-service" "$PSScriptRoot\gateway-service"
Wait-Port 8083 "billing-service"
Wait-Port 8888 "gateway-service"

Write-Host "=== Demarrage du client Angular (port 4200) ===" -ForegroundColor Cyan
Start-Process -FilePath "npm.cmd" -ArgumentList "start" -WorkingDirectory "$PSScriptRoot\angular-front-app" -RedirectStandardOutput "$PSScriptRoot\logs\angular.out.log" -RedirectStandardError "$PSScriptRoot\logs\angular.err.log" -WindowStyle Hidden
Wait-Port 4200 "angular-front-app"

Write-Host ""
Write-Host "Tous les services sont demarres !" -ForegroundColor Green
Write-Host "- Eureka:   http://localhost:8761"
Write-Host "- Config:   http://localhost:9999/customer-service/default"
Write-Host "- Gateway:  http://localhost:8888/billing-service/fullBills"
Write-Host "- Angular:  http://localhost:4200"

Start-Sleep -Seconds 10
Write-Host ""
Write-Host "=== Test des endpoints via Spring Cloud Gateway (8888) ===" -ForegroundColor Cyan
try {
    $customers = Invoke-RestMethod "http://localhost:8888/customer-service/api/customers"
    Write-Host "Customers:" ($customers._embedded.customers | ConvertTo-Json -Compress)
    $products = Invoke-RestMethod "http://localhost:8888/inventory-service/api/products"
    Write-Host "Products:" ($products._embedded.products | ConvertTo-Json -Compress)
    $bills = Invoke-RestMethod "http://localhost:8888/billing-service/fullBills"
    Write-Host "FullBills count:" $bills.Count
} catch {
    Write-Host "Note: Gateway/Eureka encore en cours de synchronisation: $_" -ForegroundColor Yellow
}

if ($KeepAlive) {
    Write-Host "Mode KeepAlive actif (Ctrl+C pour arreter)." -ForegroundColor Cyan
    while ($true) { Start-Sleep -Seconds 30 }
}
