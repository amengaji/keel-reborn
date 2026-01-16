# Define the output file name
$OutputFileName = "project_structure.txt"
$OutputFilePath = Join-Path (Get-Location) $OutputFileName

# Clear existing file if it exists
if (Test-Path $OutputFilePath) { Remove-Item $OutputFilePath }
New-Item -Path $OutputFilePath -ItemType File -Force | Out-Null

function Show-ReactTree {
    param (
        [string]$Path = (Get-Location),
        [string]$Indent = "",
        [bool]$Last = $true
    )

    # Excluded folders
    $excludeList = @(
        "node_modules", ".git", ".expo", ".vscode", 
        "dist", "web-build", "build", "Pods", 
        ".bundle", "coverage", "yarn.lock", "package-lock.json"
    )

    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | 
             Where-Object { $excludeList -notcontains $_.Name }

    $count = 0
    foreach ($item in $items) {
        $count++
        $isLastItem = $count -eq $items.Count
        
        if ($isLastItem) { $marker = "+-- " } else { $marker = "+-- " }
        
        # 1. Create the plain text line for the file
        $cleanLine = "$Indent$marker$($item.Name)"
        
        # 2. Append to the text file (using script scope variable)
        Add-Content -Path $script:OutputFilePath -Value $cleanLine

        if ($item.PSIsContainer) {
            # 3. Write colored output to screen
            Write-Host "$Indent$marker" -NoNewline -ForegroundColor DarkGray
            Write-Host "$($item.Name)" -ForegroundColor Cyan
            
            # Calculate next indent (PS 5.1 compatible)
            if ($isLastItem) { 
                $addIndent = "    " 
            } else { 
                $addIndent = "¦   " 
            }
            $nextIndent = $Indent + $addIndent
            
            Show-ReactTree -Path $item.FullName -Indent $nextIndent
        } else {
            # 3. Write colored output to screen
            Write-Host "$Indent$marker" -NoNewline -ForegroundColor DarkGray
            Write-Host "$($item.Name)" -ForegroundColor White
        }
    }
}

Write-Host "Generating tree..." -ForegroundColor Yellow
Show-ReactTree
Write-Host "`nSaved to: $OutputFileName" -ForegroundColor Green
