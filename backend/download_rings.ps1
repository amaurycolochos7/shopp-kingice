$dir = "c:\Users\Amaury\.gemini\antigravity\scratch\king_ice_gold\frontend\images\products\anillos"
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

$images = @(
    @{name="anillo-domo-baguette-1.webp"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/AN10B04A50_1_50bd8a68-f635-46af-a86b-e69a37934e0c_700x.webp"},
    @{name="anillo-cruz-boreal-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_469911801_445287521772477_1263865290979239306_n.jpg"},
    @{name="anillo-eternel-amour-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/S.jpg"},
    @{name="anillo-loro-boreal-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_358760486_671709284774774_428050513088498951_n.jpg"},
    @{name="anillo-octavia-royale-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_351444600_952774582704347_8082096704879047735_n.jpg"},
    @{name="anillo-panthera-verde-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_347620559_946045643256596_3566589564694349183_n.jpg"},
    @{name="anillo-laberinto-memento-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_469005686_17941842548924493_8520008712159195333_n.jpg"},
    @{name="anillo-medusa-aurea-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_469000185_17941834469924493_7856627065934140081_n.jpg"},
    @{name="anillo-relicario-solar-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474997026_17948480453924493_1513421740489888807_n.jpg"},
    @{name="anillo-astra-blanco-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/01/2023-05-11_3100589182817136497.jpg"},
    @{name="anillo-doble-calavera-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_276986385_2509718419158944_6973571085491986685_n.jpg"},
    @{name="anillo-pantera-glaciar-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_491441224_17957945324924493_7153200962233526720_n.jpg"},
    @{name="anillo-gorgona-eterna-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474563833_17948055803924493_5683500236331435502_n.jpg"},
    @{name="anillo-fauces-escarlatas-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_468954024_17941833761924493_4329436721271677712_n.jpg"},
    @{name="anillo-sello-calaveras-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_468944569_17941842167924493_9348270889869932_n.jpg"},
    @{name="anillo-aegis-obsidiana-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_469006071_17941842584924493_621022765870932808_n.jpg"},
    @{name="anillo-aquila-rex-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474431224_17948055324924493_7143200962233526720_n.jpg"},
    @{name="anillo-panthera-blanco-1.jpg"; url="https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474991224_17948485324924493_7153200962233526720_n.jpg"}
)

$i = 0
foreach ($img in $images) {
    $i++
    $outPath = Join-Path $dir $img.name
    try {
        Invoke-WebRequest -Uri $img.url -OutFile $outPath -UserAgent $ua -ErrorAction Stop
        $size = [math]::Round((Get-Item $outPath).Length / 1KB)
        Write-Host "[OK $i/18] $($img.name) (${size}KB)"
    } catch {
        Write-Host "[FAIL $i/18] $($img.name) - $($_.Exception.Message)"
    }
}

Write-Host "`nDone! Downloaded images:"
Get-ChildItem $dir -Filter "anillo-*" | ForEach-Object { Write-Host "  $($_.Name) ($([math]::Round($_.Length/1KB))KB)" }
