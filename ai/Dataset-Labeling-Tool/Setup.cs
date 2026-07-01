using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Reflection;

namespace CitraLabelingInstaller
{
    public class InstallerForm : Form
    {
        private Button btnInstall;
        private Button btnCancel;
        private Label lblTitle;
        private Label lblDesc;

        public InstallerForm()
        {
            this.Text = "CitraLabeling Studio Pro - Setup Installer";
            this.Size = new Size(500, 320);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            lblTitle = new Label();
            lblTitle.Text = "CitraLabeling Studio Pro (v4.9)";
            lblTitle.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(56, 189, 248);
            lblTitle.Location = new Point(30, 25);
            lblTitle.Size = new Size(430, 35);
            this.Controls.Add(lblTitle);

            lblDesc = new Label();
            lblDesc.Text = "Aplikasi Anotasi YOLO/VOC Bulk High-Speed & AI Auto-Label.\r\n\r\nInstaller resmi ini akan memasang aplikasi secara offline ke komputer Anda dan membuat pintasan di Desktop & Start Menu Windows.";
            lblDesc.Font = new Font("Segoe UI", 10, FontStyle.Regular);
            lblDesc.ForeColor = Color.FromArgb(203, 213, 225);
            lblDesc.Location = new Point(30, 70);
            lblDesc.Size = new Size(430, 100);
            this.Controls.Add(lblDesc);

            btnInstall = new Button();
            btnInstall.Text = "Install Sekarang";
            btnInstall.Font = new Font("Segoe UI", 11, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(16, 185, 129);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Location = new Point(30, 200);
            btnInstall.Size = new Size(200, 45);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += new EventHandler(Install_Click);
            this.Controls.Add(btnInstall);

            btnCancel = new Button();
            btnCancel.Text = "Batal";
            btnCancel.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnCancel.BackColor = Color.FromArgb(51, 65, 85);
            btnCancel.ForeColor = Color.White;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(250, 200);
            btnCancel.Size = new Size(120, 45);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += new EventHandler((s, e) => { this.Close(); });
            this.Controls.Add(btnCancel);
        }

        private void ExtractResource(string resName, string targetPath)
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                foreach (string name in asm.GetManifestResourceNames())
                {
                    if (name.EndsWith(resName, StringComparison.OrdinalIgnoreCase))
                    {
                        using (Stream s = asm.GetManifestResourceStream(name))
                        using (StreamReader r = new StreamReader(s))
                        {
                            string content = r.ReadToEnd();
                            if (resName.Equals("script.js", StringComparison.OrdinalIgnoreCase))
                            {
                                content = "window.IS_OFFLINE_STANDALONE = true;\n" + content;
                            }
                            File.WriteAllText(targetPath, content);
                            return;
                        }
                    }
                }
            }
            catch {}
        }

        private void Install_Click(object sender, EventArgs e)
        {
            btnInstall.Enabled = false;
            btnInstall.Text = "Menginstal...";
            try
            {
                string appDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CitraLabelingStudioPro");
                if (!Directory.Exists(appDir))
                {
                    Directory.CreateDirectory(appDir);
                }

                string targetHtml = Path.Combine(appDir, "index.html");
                string targetCss = Path.Combine(appDir, "style.css");
                string targetJs = Path.Combine(appDir, "script.js");
                string targetMidtrans = Path.Combine(appDir, "midtrans-pay.js");
                
                // Try copying from local directory first if available
                string curDir = AppDomain.CurrentDomain.BaseDirectory;
                if (File.Exists(Path.Combine(curDir, "index.html")) && !curDir.Equals(appDir, StringComparison.OrdinalIgnoreCase))
                {
                    foreach (string file in Directory.GetFiles(curDir))
                    {
                        string fname = Path.GetFileName(file);
                        if (!fname.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                        {
                            File.Copy(file, Path.Combine(appDir, fname), true);
                        }
                    }
                }
                else
                {
                    // Extract embedded resources
                    ExtractResource("index.html", targetHtml);
                    ExtractResource("style.css", targetCss);
                    ExtractResource("script.js", targetJs);
                    ExtractResource("midtrans-pay.js", targetMidtrans);
                }

                // Ensure index.html references local files correctly
                if (File.Exists(targetHtml))
                {
                    string html = File.ReadAllText(targetHtml);
                    html = html.Replace("../midtrans-pay.js", "midtrans-pay.js");
                    html = html.Replace("IS_OFFLINE_STANDALONE = false", "IS_OFFLINE_STANDALONE = true");
                    File.WriteAllText(targetHtml, html);
                }

                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string lnkPath = Path.Combine(desktopPath, "CitraLabeling Studio Pro.lnk");
                string psCmd = string.Format("$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('{0}'); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=\"\"{1}\"\"'; $s.WorkingDirectory = '{2}'; $s.Description = 'CitraLabeling Studio Pro'; $s.Save();", lnkPath.Replace("'", "''"), targetHtml, appDir.Replace("'", "''"));

                ProcessStartInfo psi = new ProcessStartInfo("powershell", "-NoProfile -Command \"" + psCmd + "\"");
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                p.WaitForExit();

                string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");
                string startLnkPath = Path.Combine(startMenuPath, "CitraLabeling Studio Pro.lnk");
                string psCmdStart = string.Format("$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('{0}'); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=\"\"{1}\"\"'; $s.WorkingDirectory = '{2}'; $s.Description = 'CitraLabeling Studio Pro'; $s.Save();", startLnkPath.Replace("'", "''"), targetHtml, appDir.Replace("'", "''"));

                ProcessStartInfo psiStart = new ProcessStartInfo("powershell", "-NoProfile -Command \"" + psCmdStart + "\"");
                psiStart.CreateNoWindow = true;
                psiStart.UseShellExecute = false;
                Process pStart = Process.Start(psiStart);
                pStart.WaitForExit();

                MessageBox.Show("✅ Instalasi CitraLabeling Studio Pro Berhasil!\r\n\r\nPintasan telah dibuat di Desktop Anda. Aplikasi akan dijalankan sekarang.", "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);

                ProcessStartInfo launch = new ProcessStartInfo("msedge.exe", "--app=\"" + targetHtml + "\"");
                launch.UseShellExecute = true;
                try { Process.Start(launch); }
                catch { Process.Start("explorer.exe", targetHtml); }

                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Terjadi kesalahan saat instalasi: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnInstall.Enabled = true;
                btnInstall.Text = "Install Sekarang";
            }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
