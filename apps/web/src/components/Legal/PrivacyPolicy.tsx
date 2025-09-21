/**
 * Privacy Policy Component
 * Compliant with Chrome Web Store user data policies and GDPR requirements
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <Badge variant="secondary" className="mt-2">GDPR Compliant</Badge>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Privacy-First Approach:</strong> We collect only the minimum data necessary 
          for our service to function. Your privacy and data security are our top priorities.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Authentication Information</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Wallet addresses:</strong> For secure blockchain-based authentication</li>
              <li><strong className="text-foreground">Digital signatures:</strong> To verify transaction authorization</li>
              <li><strong className="text-foreground">Session tokens:</strong> To maintain secure login sessions</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              <strong>Why:</strong> Required for secure account access and payment processing
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Campaign Data</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Target URLs:</strong> TikTok posts and profiles (encoded for privacy)</li>
              <li><strong className="text-foreground">Targeting preferences:</strong> Geographic, demographic settings</li>
              <li><strong className="text-foreground">Campaign budgets:</strong> Spending limits and payment amounts</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              <strong>Why:</strong> Necessary to deliver advertising services as requested
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Transaction Information</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Payment records:</strong> USDC transactions on Base blockchain</li>
              <li><strong className="text-foreground">Transaction hashes:</strong> For verification and audit trails</li>
              <li><strong className="text-foreground">Completion status:</strong> Action verification and payment triggers</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              <strong>Why:</strong> Required for payment processing and financial transparency
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Extension Activity (When Applicable)</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Action completion:</strong> Verification that likes/follows were performed</li>
              <li><strong className="text-foreground">Page context:</strong> Only on supported social media platforms</li>
              <li><strong className="text-foreground">Timing data:</strong> When actions were completed</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              <strong>Why:</strong> Required to verify legitimate completion of paid actions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Information We DO NOT Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-destructive">Never Collected:</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Browsing history outside our service</li>
                <li>Social media passwords or tokens</li>
                <li>Private messages or communications</li>
                <li>Personal photos or content</li>
                <li>Contact lists or friend networks</li>
                <li>Location data or device information</li>
                <li>Biometric or health information</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-primary">Privacy Protections:</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>No cross-site tracking</li>
                <li>No behavioral profiling</li>
                <li>No data selling to third parties</li>
                <li>No permanent local storage</li>
                <li>No background data collection</li>
                <li>No access to other extensions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legitimate Uses:</h4>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Service delivery:</strong> Execute campaigns and process payments as requested</li>
              <li><strong className="text-foreground">Quality assurance:</strong> Verify legitimate engagement and prevent fraud</li>
              <li><strong className="text-foreground">Platform compliance:</strong> Ensure adherence to social media platform policies</li>
              <li><strong className="text-foreground">Security:</strong> Protect against unauthorized access and malicious activity</li>
              <li><strong className="text-foreground">Support:</strong> Provide customer assistance and troubleshooting</li>
              <li><strong className="text-foreground">Legal compliance:</strong> Meet regulatory requirements and respond to legal requests</li>
            </ul>
          </div>
          
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Single Purpose Compliance:</strong> All data usage is directly related to our 
              core service of facilitating paid social media engagement. We do not use your data 
              for any unrelated purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Data Protection & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Security Measures:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Encryption in transit:</strong> All data transmission uses HTTPS/TLS</li>
              <li><strong className="text-foreground">Data obfuscation:</strong> Sensitive identifiers are encoded before blockchain storage</li>
              <li><strong className="text-foreground">Access controls:</strong> Strict authentication and authorization requirements</li>
              <li><strong className="text-foreground">Audit logging:</strong> Comprehensive tracking of all data access</li>
              <li><strong className="text-foreground">Regular security reviews:</strong> Ongoing assessment of security practices</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Data Storage:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Minimal retention:</strong> Data kept only as long as necessary</li>
              <li><strong className="text-foreground">Secure infrastructure:</strong> SOC 2 compliant cloud providers</li>
              <li><strong className="text-foreground">Backup security:</strong> Encrypted backups with restricted access</li>
              <li><strong className="text-foreground">Geographic controls:</strong> Data processing within appropriate jurisdictions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Data Sharing & Third Parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Limited Sharing:</h4>
            <p className="text-sm text-muted-foreground">We share data only in these specific circumstances:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Blockchain networks:</strong> Transaction data is publicly recorded (but obfuscated)</li>
              <li><strong className="text-foreground">Payment processors:</strong> USDC transaction processing on Base network</li>
              <li><strong className="text-foreground">Service providers:</strong> Essential infrastructure partners under strict data agreements</li>
              <li><strong className="text-foreground">Legal requirements:</strong> When required by law or valid legal process</li>
              <li><strong className="text-foreground">User consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">What We Never Do:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Sell or rent your personal information</li>
              <li>Share data with advertisers beyond campaign execution</li>
              <li>Use data for unrelated marketing purposes</li>
              <li>Transfer data without adequate protections</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Your Rights & Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Your Rights:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-foreground">Rectification:</strong> Correct inaccurate information</li>
              <li><strong className="text-foreground">Erasure:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong className="text-foreground">Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong className="text-foreground">Objection:</strong> Object to certain types of data processing</li>
              <li><strong className="text-foreground">Restriction:</strong> Limit how we process your data</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">How to Exercise Rights:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Email us at privacy@xad.com with your request</li>
              <li>Use the account settings in our application</li>
              <li>Contact our support team for assistance</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Response time: We respond to all privacy requests within 30 days
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Cookies & Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Essential Cookies Only:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Authentication:</strong> Session management and login state</li>
              <li><strong className="text-foreground">Security:</strong> CSRF protection and fraud prevention</li>
              <li><strong className="text-foreground">Functionality:</strong> User preferences and application state</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">No Tracking:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>No analytics cookies</li>
              <li>No advertising trackers</li>
              <li>No cross-site tracking</li>
              <li>No third-party marketing pixels</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. International Transfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            As a blockchain-based service, some data may be processed across international borders. 
            We ensure adequate protection through:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Standard contractual clauses with service providers</li>
            <li>Data minimization practices</li>
            <li>Encryption and security controls</li>
            <li>Compliance with applicable data protection laws</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Policy Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We may update this Privacy Policy to reflect changes in our practices, legal requirements, 
            or service features. We will notify you of material changes through:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Email notifications (if you have an account)</li>
            <li>In-app notifications</li>
            <li>Prominent notices on our website</li>
            <li>Updated version dates on this page</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For questions about this Privacy Policy or to exercise your privacy rights:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Contact:</strong> Visit our website for privacy inquiries</li>
          </ul>
          
          <div className="p-3 bg-muted rounded-lg border">
            <p className="text-xs text-muted-foreground">
              <strong>EU/UK Residents:</strong> You have the right to lodge a complaint with your 
              local data protection authority if you believe your privacy rights have been violated.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground border-t border-border pt-6">
        <p>
          This Privacy Policy is effective immediately and governs our collection, use, 
          and protection of your information while using zkad services.
        </p>
      </div>
    </div>
  );
}