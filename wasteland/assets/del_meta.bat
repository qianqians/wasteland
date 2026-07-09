set "target_dir=D:\Personal\game\wasteland\wasteland\assets\role\RoleSpine"

echo 正在删除 %target_dir% 及其子目录下的 .meta 文件...
echo.

:: 删除 .meta 文件
for /r "%target_dir%" %%f in (*.meta) do (
    echo 删除: %%f
    del /f /q "%%f"
)

pause