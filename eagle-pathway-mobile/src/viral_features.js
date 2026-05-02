const fs = require('fs');

// ─── 2. Add Match Notification to notifications service ──────────────────────
const notifPath = 'c:\\Users\\hp\\Documents\\Eagle_Pathway_Codebase\\eagle-pathway-mobile\\src\\services\\notifications.ts';
let notif = fs.readFileSync(notifPath, 'utf8');

const matchNotifFunction = `
  async sendMatchNotification(scholarshipName: string, matchScore: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 ' + matchScore + '% Match Found!',
        body: 'A new scholarship "' + scholarshipName + '" matches your profile. Tap to apply now!',
        data: { type: 'scholarship_match' },
        sound: true,
      },
      trigger: null, // Immediate
    });
  },

  async checkAndNotifyMatches(userId: string, scholarships: any[]): Promise<void> {
    const highMatches = scholarships.filter((s: any) => (s.matchScore || 0) >= 85);
    for (const match of highMatches.slice(0, 2)) {
      await this.sendMatchNotification(match.name, match.matchScore);
      // Store notification in DB
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎯 ' + match.matchScore + '% Match: ' + match.name,
        body: 'This scholarship from ' + match.organization + ' is a near-perfect fit for your profile!',
        type: 'scholarship_match',
        is_read: false,
      }).select();
    }
  },
`;

notif = notif.replace(
  `  addNotificationListener(handler`,
  matchNotifFunction + `  addNotificationListener(handler`
);

fs.writeFileSync(notifPath, notif, 'utf8');
console.log('✅ 2/3: Match Notifications added');


// ─── 3. Add Referral System to Profile Screen ────────────────────────────────
const screensPath = 'c:\\Users\\hp\\Documents\\Eagle_Pathway_Codebase\\eagle-pathway-mobile\\src\\screens\\index.tsx';
let screens = fs.readFileSync(screensPath, 'utf8');

// Add Share import
if (!screens.includes('Share,')) {
  screens = screens.replace(
    `  FlatList, Alert, Switch, Linking, ActivityIndicator, TextInput,`,
    `  FlatList, Alert, Switch, Linking, ActivityIndicator, TextInput, Share,`
  );
}

// Add referral card before the menu items
const referralCard = `
        {/* Referral Card */}
        <TouchableOpacity 
          style={profStyles.referralCard} 
          onPress={async () => {
            const code = (user?.full_name?.replace(/\\s+/g, '').slice(0, 6) || 'EAGLE') + Math.floor(1000 + Math.random() * 9000);
            try {
              await Share.share({
                message: '🦅 Join me on Eagle Pathway — the smartest way to find and win scholarships abroad!\\n\\nUse my code: ' + code + '\\n\\nDownload: https://eaglepathway.app/invite/' + code,
              });
            } catch (e) {}
          }}
          activeOpacity={0.9}
        >
          <View style={profStyles.referralContent}>
            <View style={profStyles.referralIcon}><Text style={{ fontSize: 24 }}>🎁</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={profStyles.referralTitle}>Invite Friends, Get Rewards</Text>
              <Text style={profStyles.referralSub}>Share your code and earn free premium SOP reviews when friends sign up</Text>
            </View>
            <Text style={{ fontSize: 18, color: Colors.gold }}>→</Text>
          </View>
        </TouchableOpacity>
`;

if (screens.includes('{/* Menu Items */}') && !screens.includes('referralCard')) {
  screens = screens.replace(
    `      {/* Menu Items */}`,
    referralCard + `      {/* Menu Items */}`
  );
}

// Add referral card styles
if (!screens.includes('referralCard:')) {
  screens = screens.replace(
    `  personaTextActive: { color: Colors.blueDark },`,
    `  personaTextActive: { color: Colors.blueDark },
  referralCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  referralContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  referralIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  referralTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text, marginBottom: 2 },
  referralSub: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },`
  );
}

fs.writeFileSync(screensPath, screens, 'utf8');
console.log('✅ 3/3: Referral System added');
