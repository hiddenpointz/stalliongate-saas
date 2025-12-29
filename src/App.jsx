import React, { useState, useEffect } from 'react';
import { Copy, Check, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, Users, Link2, Shield, DollarSign, Key, ExternalLink, Clock, TrendingUp, Zap } from 'lucide-react';

const StalliongateSaaS = () => {
  const [view, setView] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (customers.length > 0) {
      saveData();
    }
  }, [customers]);

  const loadData = async () => {
    try {
      const result = await window.storage.get('stalliongate-customers');
      if (result && result.value) {
        setCustomers(JSON.parse(result.value));
      }
    } catch (err) {
      console.log('No existing data found');
    }
  };

  const saveData = async () => {
    try {
      await window.storage.set('stalliongate-customers', JSON.stringify(customers));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  const generateProxyUrl = (originalUrl, customerId) => {
    const token = btoa(`${customerId}-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    // TODO: Replace with your actual Vercel URL after deployment
    return `https://stalliongate-saas.vercel.app/api/proxy?token=${token}`;
  };

  const generateApiKey = () => {
    return 'sg_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addCustomer = () => {
    setError('');
    
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    
    if (!originalUrl.trim()) {
      setError('Please enter content URL to protect');
      return;
    }

    if (!isValidUrl(originalUrl)) {
      setError('Please enter a valid URL (include https://)');
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      name: customerName.trim(),
      email: customerEmail.trim(),
      originalUrl: originalUrl.trim(),
      proxyUrl: '',
      apiKey: generateApiKey(),
      plan: plan,
      subscriptionActive: true,
      accessCount: 0,
      lastAccess: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
    };

    newCustomer.proxyUrl = generateProxyUrl(originalUrl, newCustomer.id);
    
    setCustomers([...customers, newCustomer]);
    setCustomerName('');
    setCustomerEmail('');
    setOriginalUrl('');
  };

  const toggleSubscription = (customerId) => {
    setCustomers(customers.map(c => 
      c.id === customerId 
        ? { ...c, subscriptionActive: !c.subscriptionActive }
        : c
    ));
  };

  const deleteCustomer = (customerId) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const renewSubscription = (customerId) => {
    setCustomers(customers.map(c => {
      if (c.id === customerId) {
        const days = c.plan === 'monthly' ? 30 : 365;
        return {
          ...c,
          expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionActive: true
        };
      }
      return c;
    }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = customers.filter(c => c.subscriptionActive).length;
  const inactiveCount = customers.length - activeCount;
  const totalRevenue = customers.reduce((sum, c) => {
    return sum + (c.subscriptionActive ? (c.plan === 'monthly' ? 29 : 290) : 0);
  }, 0);
  const totalAccess = customers.reduce((sum, c) => sum + c.accessCount, 0);

  const isExpiringSoon = (date) => {
    const daysUntilExpiry = Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative">
              <Zap className="text-amber-400 absolute -top-1 -left-1" size={20} />
              <Shield className="text-indigo-400" size={40} />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Stalliongate
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Premium Content Gating & Access Control Platform</p>
          <p className="text-indigo-300 text-sm mt-1">Powerful Protection for Your Digital Assets 🐴</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setView('customers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'customers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Users size={20} />
            Customers
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'analytics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <TrendingUp size={20} />
            Analytics
          </button>
        </div>

        {view === 'customers' && (
          <>
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-indigo-400/50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-indigo-400" size={24} />
                  <div className="text-gray-300 text-sm">Total Customers</div>
                </div>
                <div className="text-3xl font-bold text-white">{customers.length}</div>
              </div>
              <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="text-green-400" size={24} />
                  <div className="text-green-200 text-sm">Active Gates</div>
                </div>
                <div className="text-3xl font-bold text-green-100">{activeCount}</div>
              </div>
              <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-blue-400" size={24} />
                  <div className="text-blue-200 text-sm">Monthly Revenue</div>
                </div>
                <div className="text-3xl font-bold text-blue-100">${totalRevenue}</div>
              </div>
              <div className="bg-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <ExternalLink className="text-purple-400" size={24} />
                  <div className="text-purple-200 text-sm">Total Access</div>
                </div>
                <div className="text-3xl font-bold text-purple-100">{totalAccess}</div>
              </div>
            </div>

            {/* Add Customer Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Plus size={24} />
                Add New Customer
              </h2>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-300" size={20} />
                  <span className="text-red-200">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Subscription Plan *</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="monthly">Monthly - $29/mo</option>
                    <option value="yearly">Yearly - $290/yr</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Content URL to Protect *</label>
                <input
                  type="text"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/premium-content"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
              </div>
              
              <button
                onClick={addCustomer}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
              >
                <Plus size={20} />
                Create Protected Gate
              </button>
            </div>

            {/* Customer List */}
            <div className="space-y-4">
              {customers.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-12 text-center border border-white/10">
                  <Shield className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-400 text-lg mb-2">No customers yet</p>
                  <p className="text-gray-500">Add your first customer to start protecting content with Stalliongate</p>
                </div>
              ) : (
                customers.map((customer) => {
                  const daysUntilExpiry = Math.floor((new Date(customer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpiring = isExpiringSoon(customer.expiresAt);
                  
                  return (
                    <div
                      key={customer.id}
                      className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border transition-all ${
                        customer.subscriptionActive 
                          ? isExpiring ? 'border-yellow-500/30' : 'border-green-500/30' 
                          : 'border-red-500/30 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  customer.subscriptionActive
                                    ? isExpiring 
                                      ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                                      : 'bg-green-500/20 text-green-200 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-200 border border-red-500/30'
                                }`}
                              >
                                {customer.subscriptionActive 
                                  ? isExpiring ? `Expires in ${daysUntilExpiry}d` : 'Active'
                                  : 'Inactive'}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                                {customer.plan === 'monthly' ? 'Monthly' : 'Yearly'}
                              </span>
                            </div>
                            <div className="text-gray-300 text-sm mb-3">{customer.email}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Link2 className="text-gray-400" size={16} />
                              <span className="text-gray-400 text-sm">Original URL:</span>
                            </div>
                            <div className="text-gray-200 text-sm bg-black/30 px-3 py-2 rounded break-all">
                              {customer.originalUrl}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="text-indigo-400" size={16} />
                              <span className="text-gray-400 text-sm">Stalliongate Protected URL:</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-indigo-300 text-sm bg-black/30 px-3 py-2 rounded flex-1 break-all">
                                {customer.proxyUrl}
                              </code>
                              <button
                                onClick={() => copyToClipboard(customer.proxyUrl, customer.id)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded transition-colors shrink-0"
                                title="Copy gate URL"
                              >
                                {copiedId === customer.id ? (
                                  <Check size={16} className="text-green-400" />
                                ) : (
                                  <Copy size={16} className="text-gray-300" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">API Key</div>
                            <code className="text-xs text-gray-300 bg-black/30 px-2 py-1 rounded">{customer.apiKey}</code>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Access Count</div>
                            <div className="text-white font-semibold">{customer.accessCount}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Created</div>
                            <div className="text-white text-sm">{new Date(customer.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Expires</div>
                            <div className="text-white text-sm">{new Date(customer.expiresAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-white/10">
                          <button
                            onClick={() => toggleSubscription(customer.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              customer.subscriptionActive
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'
                            }`}
                          >
                            {customer.subscriptionActive ? (
                              <>
                                <ToggleRight size={20} />
                                Close Gate
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={20} />
                                Open Gate
                              </>
                            )}
                          </button>

                          {isExpiring && (
                            <button
                              onClick={() => renewSubscription(customer.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-lg font-medium transition-colors"
                            >
                              <Clock size={20} />
                              Renew Now
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={20} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {view === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Business Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30">
                  <div className="text-green-200 text-sm mb-2">Monthly Recurring Revenue</div>
                  <div className="text-4xl font-bold text-white mb-2">${totalRevenue}</div>
                  <div className="text-green-300 text-sm">from {activeCount} active gates</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30">
                  <div className="text-blue-200 text-sm mb-2">Total Access Events</div>
                  <div className="text-4xl font-bold text-white mb-2">{totalAccess}</div>
                  <div className="text-blue-300 text-sm">across all protected content</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
                  <div className="text-purple-200 text-sm mb-2">Churn Rate</div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {customers.length > 0 ? Math.round((inactiveCount / customers.length) * 100) : 0}%
                  </div>
                  <div className="text-purple-300 text-sm">{inactiveCount} closed gates</div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Customer Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Gates</span>
                    <span className="text-white font-bold">{activeCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Closed Gates</span>
                    <span className="text-white font-bold">{inactiveCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Monthly Plans</span>
                    <span className="text-white font-bold">{customers.filter(c => c.plan === 'monthly').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Yearly Plans</span>
                    <span className="text-white font-bold">{customers.filter(c => c.plan === 'yearly').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brand Info Section */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/30">
          <h3 className="text-lg font-bold text-indigo-200 mb-3 flex items-center gap-2">
            <Zap size={20} />
            Stalliongate - Powerful Content Protection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-indigo-300 font-semibold mb-2">What You Offer:</h4>
              <ul className="text-indigo-100 space-y-1">
                <li>• Premium content gating & access control</li>
                <li>• Unique protected URLs (Gates) per customer</li>
                <li>• Enterprise-grade subscription management</li>
                <li>• Real-time analytics & tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="text-purple-300 font-semibold mb-2">Revenue Model:</h4>
              <ul className="text-purple-100 space-y-1">
                <li>• Monthly plans: $29/month per gate</li>
                <li>• Yearly plans: $290/year per gate</li>
                <li>• Unlimited scaling potential</li>
                <li>• Current MRR: ${totalRevenue}/month</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StalliongateSaaS;
