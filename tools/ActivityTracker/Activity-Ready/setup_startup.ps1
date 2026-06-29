$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"D:\Activity\run_hidden.vbs`""
$trigger = New-ScheduledTaskTrigger -Daily -At 6:00AM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -TaskName "ActivityTracker" -Description "Auto Start Activity Tracker silently" -Force
Write-Host "Task Scheduled Silently"
