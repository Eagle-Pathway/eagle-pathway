import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar } from '@/components/common';
import { scholarshipsService } from '@/services/scholarships';
import { getUserRole } from '@/utils/role';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useDocumentStore } from '@/store/documentStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useParentStore } from '@/store/parentStore';
import { supabase } from '@/services/supabase';

export function ProfileScreen() {
  const { user, signOut, uploadAvatar } = useAuthStore();
  const { applications } = useScholarshipStore();
  const { documents } = useDocumentStore();
  const { unreadCount } = useNotificationStore();
  const { inviteParent, linkStudent, loadPendingLinks, verifyLink, removeLink } = useParentStore();
  const [uploading, setUploading] = useState(false);
  const [pendingLinks, setPendingLinks] = useState<any[]>([]);
  const [linkingPhone, setLinkingPhone] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [openJobsCount, setOpenJobsCount] = useState(0);

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EP';
  const role = getUserRole(user);

  useEffect(() => {
    if (user) {
      loadPendingLinks(user.id, role as any)
        .then(setPendingLinks)
        .catch(console.error);
    }
    if (role === 'tutor') {
      supabase.from('tutor_job_posts').select('id', { count: 'exact', head: true }).eq('status', 'open').then(({ count }) => {
        if (count !== null) setOpenJobsCount(count);
      }).catch(console.error);
    }
  }, [user?.id, role]);

  const handlePickAvatar = async () => {
    try {
      const result = await scholarshipsService.pickDocument();
      if (result.canceled || !result.assets?.[0] || !user) return;
      
      setUploading(true);
      const asset = result.assets[0];
      await uploadAvatar(asset.uri, asset.name || 'avatar.jpg');
      Alert.alert('Success', 'Profile picture updated! ✨');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/splash'); } },
    ]);
  };

  const handleLinkAction = async () => {
    if (!user) return;
    if (!linkingPhone) return Alert.alert('Error', 'Please enter a phone number');
    setIsLinking(true);
    try {
      if (role === 'student') {
        await inviteParent(user.id, linkingPhone);
        Alert.alert('Success', 'Invitation sent to your parent! They need to verify it in their app.');
      } else {
        await linkStudent(user!.id, linkingPhone);
        Alert.alert('Success', 'Link request sent to the student!');
      }
      setLinkingPhone('');
      const updated = await loadPendingLinks(user!.id, role as any);
      setPendingLinks(updated);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyLink = async (linkId: string) => {
    try {
      await verifyLink(linkId);
      Alert.alert('Success', 'Link verified successfully! ✨');
      const updated = await loadPendingLinks(user!.id, role as any);
      setPendingLinks(updated);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to verify link');
    }
  };

  const MENU_ITEMS = [
    ...(role === 'tutor'
      ? [
          { icon: '💼', label: 'Tutor Jobs', badge: openJobsCount > 0 ? `${openJobsCount} open` : null, color: Colors.orangeLight, route: '/tutor-jobs', danger: false },
          { icon: '📋', label: 'My Applications', badge: null, color: Colors.greenLight, route: '/my-applications', danger: false },
        ]
      : []),
    { icon: '📊', label: 'My Progress', badge: null, color: Colors.blueLight, route: '/progress', danger: false },
    { icon: '🎓', label: 'Scholarship Apps', badge: `${applications.filter(a => !['accepted','rejected'].includes(a.status)).length} Active`, color: Colors.goldLight, route: '/tracker', danger: false },
    { icon: '📁', label: 'Documents', badge: documents.filter(d => d.status !== 'approved').length > 0 ? 'Action needed' : null, color: Colors.greenLight, route: '/documents', danger: false },
    { icon: '✉️', label: 'Recommendation Letters', badge: null, color: Colors.blueLight, route: '/recommendations', danger: false },
    { icon: '🏆', label: 'Success Stories', badge: null, color: Colors.goldLight, route: '/success-stories', danger: false },
    { icon: '📚', label: 'Resources', badge: null, color: Colors.blueLight, route: '/resources', danger: false },
    { icon: '📅', label: 'My Bookings', badge: null, color: Colors.grayLight, route: '/(tabs)/bookings', danger: false },
    { icon: '🔔', label: 'Notifications', badge: unreadCount > 0 ? `${unreadCount} New` : null, color: Colors.blueLight, route: '/notifications', danger: false },
    { icon: '⚙️', label: 'Settings', badge: null, color: Colors.grayLight, route: '/settings', danger: false },
    { icon: '🚪', label: 'Sign Out', badge: null, color: '#fef2f2', route: null, danger: true },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={profStyles.hero}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploading} activeOpacity={0.8}>
          <Avatar 
            initials={initials} 
            imageUri={user?.avatar_url}
            size={90} 
            borderRadius={30} 
            color={Colors.gold} 
            style={{ marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }} 
          />
          <View style={profStyles.editBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={{ fontSize: 12 }}>✏️</Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={profStyles.name}>{user?.full_name || 'User'}</Text>
        <Text style={profStyles.role}>
          {(role || 'student').charAt(0).toUpperCase()}{(role || 'student').slice(1)}
        </Text>
        <View style={profStyles.badges}>
          {user?.grade_level && <View style={profStyles.badge}><Text style={profStyles.badgeText}>{user.grade_level}</Text></View>}
          {user?.city && <View style={profStyles.badge}><Text style={profStyles.badgeText}>{user.city}</Text></View>}
          <View style={profStyles.badge}><Text style={profStyles.badgeText}>{user?.email || user?.phone || ''}</Text></View>
        </View>

        <TouchableOpacity 
          style={profStyles.editProfileBtn} 
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.8}
        >
          <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 13 }}>Edit Profile</Text>
        </TouchableOpacity>

      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {(role === 'student' || role === 'parent') && (
          <View style={profStyles.referralCard}>
            <View style={profStyles.referralContent}>
              <View style={profStyles.referralIcon}>
                <Text style={{ fontSize: 24 }}>{role === 'student' ? '👨‍👩‍👧' : '🎓'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={profStyles.referralTitle}>
                  {role === 'student' ? 'Link Your Parent' : 'Link Your Child'}
                </Text>
                <Text style={profStyles.referralSub}>
                  {role === 'student' 
                    ? 'Let your parents track your scholarship progress.' 
                    : 'Track your child\'s applications and help them succeed.'}
                </Text>
              </View>
            </View>
            
            <View style={{ padding: Spacing.lg, paddingTop: 0 }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TextInput
                  style={[profStyles.input, { flex: 1, backgroundColor: Colors.bg }]}
                  placeholder={role === 'student' ? "Parent's Phone Number" : "Student's Phone Number"}
                  value={linkingPhone}
                  onChangeText={setLinkingPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity 
                  style={[profStyles.linkBtnSmall, isLinking && { opacity: 0.7 }]} 
                  onPress={handleLinkAction}
                  disabled={isLinking}
                >
                  {isLinking ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={profStyles.linkBtnText}>Link</Text>}
                </TouchableOpacity>
              </View>

              {pendingLinks.length > 0 && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={profStyles.pendingTitle}>Pending Verification</Text>
                  {pendingLinks.map(link => (
                    <View key={link.id} style={profStyles.pendingRow}>
                      <Text style={profStyles.pendingName}>
                        {role === 'student' ? link.parent?.full_name : link.student?.full_name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {role === 'parent' && (
                          <TouchableOpacity onPress={() => handleVerifyLink(link.id)} style={profStyles.verifyBtn}>
                            <Text style={profStyles.verifyBtnText}>Verify</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => removeLink(link.id)} style={profStyles.cancelBtn}>
                          <Text style={profStyles.cancelBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[profStyles.menuItem, i === 0 && profStyles.menuFirst]}
            onPress={() => item.route ? router.push(item.route as any) : item.danger ? handleSignOut() : null}
            activeOpacity={0.9}
          >
            <View style={[profStyles.menuIcon, { backgroundColor: item.color }]}><Text style={{ fontSize: 16 }}>{item.icon}</Text></View>
            <Text style={[profStyles.menuLabel, item.danger && { color: Colors.red }]}>{item.label}</Text>
            {item.badge && (
              <View style={[profStyles.menuBadge, {
                backgroundColor: item.danger ? Colors.redLight : item.label === 'Documents' ? Colors.redLight : item.label === 'Tutor Jobs' ? Colors.orangeLight : Colors.blueLight,
              }]}>
                <Text style={[profStyles.menuBadgeText, {
                  color: item.danger ? Colors.red : item.label === 'Documents' ? Colors.red : item.label === 'Tutor Jobs' ? Colors.orange : Colors.blue,
                }]}>{item.badge}</Text>
              </View>
            )}
            {!item.danger && <Text style={profStyles.menuArrow}>›</Text>}
          </TouchableOpacity>
        ))}
        <Text style={profStyles.version}>Eagle Pathway v1.0.0 · Made with ❤️ in Addis Ababa</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const profStyles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['3xl'], alignItems: 'center' },
  name: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white },
  role: { fontSize: Typography.base, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  badgeText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: 'rgba(255,255,255,0.9)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card },
  menuFirst: { borderTopWidth: 1, borderTopColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { fontSize: Typography.lg, fontWeight: Typography.medium, color: Colors.text, flex: 1 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  menuBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  menuArrow: { fontSize: Typography.xl, color: Colors.textSecondary },
  version: { textAlign: 'center', fontSize: Typography.sm, color: Colors.textSecondary, padding: Spacing.xl },
  editBadge: { position: 'absolute', bottom: 15, right: -5, backgroundColor: Colors.blue, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.blueDark },
  editProfileBtn: { marginTop: Spacing.xl, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  personaContainer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, backgroundColor: 'rgba(0,0,0,0.1)', padding: 4, borderRadius: 16 },
  personaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  personaBtnActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  personaText: { fontSize: 12, fontWeight: Typography.semibold, color: 'rgba(255,255,255,0.6)' },
  personaTextActive: { color: Colors.blueDark },
  referralCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  referralContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  referralIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  referralTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text, marginBottom: 2 },
  referralSub: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.base, color: Colors.text },
  linkBtnSmall: { backgroundColor: Colors.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, justifyContent: 'center' },
  linkBtnText: { color: Colors.white, fontWeight: 'bold' },
  pendingTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: Colors.bg, borderRadius: 8, marginBottom: 4 },
  pendingName: { fontSize: 14, fontWeight: 'bold' },
  verifyBtn: { backgroundColor: Colors.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  verifyBtnText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: Colors.redLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  cancelBtnText: { color: Colors.red, fontSize: 12 },
});
