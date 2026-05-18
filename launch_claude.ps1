Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

Start-Sleep -Seconds 3

$hwnd = [Win32]::FindWindow("Chrome_WidgetWin_1", "Whymeapp - Visual Studio Code")
if ($hwnd -eq 0) { $hwnd = [Win32]::FindWindow($null, "*Whymeapp*") }
if ($hwnd -eq 0) { $hwnd = [Win32]::FindWindow("Chrome_WidgetWin_1", $null) }

if ($hwnd -ne 0) {
    [Win32]::ShowWindow($hwnd, 1)
    Start-Sleep -Milliseconds 300
    [Win32]::SetForegroundWindow($hwnd)
    Start-Sleep -Milliseconds 800

    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(800, 500)
    Start-Sleep -Milliseconds 200

    $shell = New-Object -ComObject WScript.Shell
    $shell.SendKeys("^{j}")
    Start-Sleep -Seconds 2
    $shell.SendKeys("wsl")
    Start-Sleep -Milliseconds 300
    $shell.SendKeys("{ENTER}")
    Start-Sleep -Seconds 2
    $shell.SendKeys("cd ~/Whymeapp{ENTER}")
    Start-Sleep -Milliseconds 500
    $shell.SendKeys("claude{ENTER}")
    Write-Host "OK - COMANDOS ENVIADOS"
} else {
    Write-Host "VSCODE WINDOW NOT FOUND, intentando lanzar de nuevo"
    Start-Process -FilePath "C:\Users\rodri\AppData\Local\Programs\Microsoft VS Code\Code.exe" -ArgumentList "E:\IA\GitHub\Whymeapp"
    Start-Sleep -Seconds 10
    $hwnd2 = [Win32]::FindWindow("Chrome_WidgetWin_1", $null)
    if ($hwnd2 -ne 0) {
        [Win32]::SetForegroundWindow($hwnd2)
        Start-Sleep -Milliseconds 500
        $shell = New-Object -ComObject WScript.Shell
        $shell.SendKeys("^{j}")
        Start-Sleep -Seconds 2
        $shell.SendKeys("wsl{ENTER}")
        Start-Sleep -Seconds 2
        $shell.SendKeys("cd ~/Whymeapp{ENTER}")
        Start-Sleep -Milliseconds 500
        $shell.SendKeys("claude{ENTER}")
        Write-Host "OK - LANZADO DE NUEVO"
    }
}
