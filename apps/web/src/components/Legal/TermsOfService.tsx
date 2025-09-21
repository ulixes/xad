/**
 * Terms of Service Component
 * Compliant with Chrome Web Store guidelines for transparency and user protection
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Service Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            zkad is a platform that connects advertisers with social media users for legitimate
            engagement activities. Our single purpose is to facilitate paid social media interactions
            (likes, follows) in a transparent and compliant manner.
          </p>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">What we do:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Enable advertisers to create campaigns for TikTok engagement</li>
              <li>Allow users to earn rewards by completing legitimate social actions</li>
              <li>Process payments securely through blockchain technology</li>
              <li>Provide transparent tracking and reporting</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">What we don't do:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Create fake accounts or bot interactions</li>
              <li>Violate platform terms of service</li>
              <li>Engage in misleading or deceptive practices</li>
              <li>Store or access personal data without consent</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. User Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">For Advertisers:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Ensure all campaign content complies with platform guidelines</li>
              <li>Provide accurate targeting information</li>
              <li>Respect intellectual property rights</li>
              <li>Use your own authentic social media accounts</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">For Action Performers:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Use only your legitimate, personal social media accounts</li>
              <li>Perform genuine interactions (no bots or automated tools)</li>
              <li>Follow all social platform terms of service</li>
              <li>Report any suspicious or inappropriate campaigns</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Prohibited Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">The following activities are strictly prohibited:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Illegal content:</strong> No promotion of illegal activities, hate speech, or harmful content</li>
            <li><strong className="text-foreground">Deceptive practices:</strong> No fake accounts, misleading information, or manipulation</li>
            <li><strong className="text-foreground">Platform violations:</strong> All actions must comply with TikTok and other platform policies</li>
            <li><strong className="text-foreground">Spam behavior:</strong> No excessive, irrelevant, or unwanted interactions</li>
            <li><strong className="text-foreground">Circumvention:</strong> No attempts to bypass our security or monitoring systems</li>
            <li><strong className="text-foreground">Adult content:</strong> No sexually explicit or mature content without proper disclosure</li>
            <li><strong className="text-foreground">Copyright infringement:</strong> Respect all intellectual property rights</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Data Collection and Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We collect only the minimum data necessary for our service operation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Authentication data:</strong> Wallet addresses for secure login</li>
              <li><strong className="text-foreground">Campaign data:</strong> Target URLs and engagement preferences</li>
              <li><strong className="text-foreground">Transaction data:</strong> Payment records for transparency</li>
              <li><strong className="text-foreground">Extension activity:</strong> Action completion verification (when using our browser extension)</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm font-semibold">We do NOT collect:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Browsing history outside of our service</li>
              <li>Personal messages or private communications</li>
              <li>Social media passwords or authentication tokens</li>
              <li>Sensitive personal information</li>
            </ul>
          </div>
          
          <p className="text-xs text-muted-foreground border-t pt-3">
            See our Privacy Policy for complete details on data handling practices.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Payment Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">For Advertisers:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Payments are processed through USDC on Base blockchain</li>
              <li>All transactions are final once confirmed on-chain</li>
              <li>Campaign costs are calculated transparently based on targeting parameters</li>
              <li>No refunds for completed campaigns</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">For Action Performers:</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Rewards are paid upon verified completion of actions</li>
              <li>Payment processing may take up to 24 hours</li>
              <li>Invalid or fraudulent actions will not be compensated</li>
              <li>Users must have a compatible wallet to receive payments</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Compliance and Enforcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We actively monitor for compliance with these terms and applicable laws:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Automated systems detect suspicious activity patterns</li>
              <li>Manual review of campaigns for policy compliance</li>
              <li>User reporting system for violations</li>
              <li>Integration with platform APIs where available for validation</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm font-semibold">Violation consequences:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Account suspension or termination</li>
              <li>Forfeiture of pending payments</li>
              <li>Reporting to relevant platforms or authorities</li>
              <li>Legal action for serious violations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Service Limitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Users acknowledge and accept the following limitations:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Service availability may be interrupted for maintenance</li>
            <li>Platform policy changes may affect campaign types</li>
            <li>Blockchain network congestion may delay transactions</li>
            <li>Geographic restrictions may apply based on local laws</li>
            <li>Age restrictions: Users must be 18+ or have parental consent</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We may update these terms to reflect changes in our service, legal requirements, 
            or industry standards. Users will be notified of material changes through:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Email notifications to registered users</li>
            <li>In-app notifications when using our services</li>
            <li>Updated timestamps on this page</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Continued use of our service after changes constitutes acceptance of new terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For questions about these terms or to report violations:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Contact:</strong> Visit our website for support</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Response time: We aim to respond to all inquiries within 48 hours.
          </p>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground border-t border-border pt-6">
        <p>
          By using zkad services, you acknowledge that you have read, understood, 
          and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}